export async function api<T = unknown>(url: string, options?: RequestInit): Promise<T> {
  const opts = { ...options };

  // Definir Content-Type para JSON se houver body e não for FormData
  if (opts.body && typeof opts.body === "string" && !opts.headers) {
     opts.headers = {
       "Content-Type": "application/json",
     };
  } else if (opts.body && typeof opts.body === "string" && opts.headers) {
    if (opts.headers instanceof Headers) {
      if (!opts.headers.has("Content-Type")) {
        opts.headers.set("Content-Type", "application/json");
      }
    } else if (typeof opts.headers === "object") {
       if (!("Content-Type" in opts.headers)) {
         (opts.headers as Record<string, string>)["Content-Type"] = "application/json";
       }
    }
  }

  // Se for DELETE e tiver body vazio, remove Content-Type
  if (opts.method === "DELETE") {
    if (opts.headers) {
      if (opts.headers instanceof Headers) {
        opts.headers.delete("Content-Type");
      } else if (typeof opts.headers === "object") {
        delete (opts.headers as Record<string, string>)["Content-Type"];
      }
    }
    delete opts.body;
  }

  // Inject Profile ID
  const profileId = localStorage.getItem("selectedProfileId");
  if (profileId) {
    if (!opts.headers) opts.headers = {};
    if (opts.headers instanceof Headers) {
      opts.headers.set("x-profile-id", profileId);
    } else {
      (opts.headers as Record<string, string>)["x-profile-id"] = profileId;
    }
  }

  try {
    const res = await fetch(`http://localhost:3333${url}`, opts);

    if (!res.ok) {
      const text = await res.text();
      try {
        const json = JSON.parse(text);
        throw new Error(json.error || text || "Erro na requisição");
      } catch {
        throw new Error(text || "Erro na requisição");
      }
    }

    // Retorna vazio se status 204
    if (res.status === 204) {
      return {} as T;
    }

    return res.json().catch(() => ({}));
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
}
