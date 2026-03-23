package com.hotel.backend;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@CrossOrigin(origins = "*") // Allow frontend to call the API
public class QueryController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private ObjectMapper objectMapper;

    @PostMapping(value = "/api/query", produces = "application/json")
    public ResponseEntity<?> executeQuery(@RequestBody String requestBody) {
        String query = requestBody;
        
        try {
            // Versuche zu erkennen, ob der Input als JSON formatiert ist {"query": "SELECT ..."}
            if (requestBody.trim().startsWith("{")) {
                JsonNode jsonNode = objectMapper.readTree(requestBody);
                if (jsonNode.has("query")) {
                    query = jsonNode.get("query").asText();
                }
            }

            final String finalQuery = query.trim();
            if (finalQuery.isEmpty()) {
                 return ResponseEntity.badRequest().body(Map.of("error", "Die Query darf nicht leer sein."));
            }

            // Da beliebige Queries unterstützt werden sollen (auch UPDATE/INSERT), 
            // verwenden wir Statement.execute statt queryForList.
            Object result = jdbcTemplate.execute((Statement stmt) -> {
                boolean isResultSet = stmt.execute(finalQuery);
                
                // Falls es ein SELECT ist, lese die Returns in eine Liste von Maps ein.
                if (isResultSet) {
                    ResultSet rs = stmt.getResultSet();
                    ResultSetMetaData md = rs.getMetaData();
                    int columns = md.getColumnCount();
                    List<Map<String, Object>> list = new ArrayList<>();
                    while (rs.next()) {
                        Map<String, Object> row = new LinkedHashMap<>();
                        for (int i = 1; i <= columns; ++i) {
                            row.put(md.getColumnLabel(i), rs.getObject(i));
                        }
                        list.add(row);
                    }
                    return list;
                } else {
                    // Falls es ein UPDATE, INSERT oder DELETE ist, gebe die Anzahl der Reihen zurück.
                    return Map.of("rowsAffected", stmt.getUpdateCount());
                }
            });

            return ResponseEntity.ok(result);

        } catch (Exception e) {
            // Fehlermeldungen z.B. bei Syntax Errors genau so an die Response weiterleiten
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
