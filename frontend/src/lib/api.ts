export const executeQuery = async <T = any>(query: string): Promise<T> => {
  const res = await fetch("http://localhost:8080/api/query", {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: query,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    throw new Error(errorData?.error || "Gibt es einen Fehler in der Query?");
  }

  return res.json();
};
