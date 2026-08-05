//#region worker/index.ts
var enc = new TextEncoder();
var securityHeaders = {
	"Content-Security-Policy": "default-src 'self'; img-src 'self' blob: data: https://nawfdev.github.io; connect-src 'self'; media-src 'self' blob:; style-src 'self' 'unsafe-inline' https://nawfdev.github.io; script-src 'self' https://nawfdev.github.io; frame-ancestors 'none'; base-uri 'none'; form-action 'self'",
	"Referrer-Policy": "no-referrer",
	"X-Content-Type-Options": "nosniff",
	"X-Frame-Options": "DENY",
	"Permissions-Policy": "camera=(self), geolocation=(self), microphone=()",
	"Cache-Control": "no-store"
};
var json = (data, status = 200, extra = {}) => new Response(JSON.stringify(data), {
	status,
	headers: {
		"content-type": "application/json;charset=UTF-8",
		...securityHeaders,
		...extra
	}
});
async function hash(v) {
	return [...new Uint8Array(await crypto.subtle.digest("SHA-256", enc.encode(v)))].map((x) => x.toString(16).padStart(2, "0")).join("");
}
function random(bytes = 24) {
	const b = new Uint8Array(bytes);
	crypto.getRandomValues(b);
	return [...b].map((x) => x.toString(16).padStart(2, "0")).join("");
}
function cookie(req, name) {
	return req.headers.get("cookie")?.split(";").map((x) => x.trim()).find((x) => x.startsWith(name + "="))?.slice(name.length + 1) || "";
}
async function auth(req, env) {
	const raw = cookie(req, "savior_session");
	if (!raw) return null;
	return env.DB.prepare(`SELECT s.id,s.incident_id FROM sessions s WHERE s.session_hash=? AND s.revoked_at IS NULL AND s.expires_at>?`).bind(await hash(raw), Math.floor(Date.now() / 1e3)).first();
}
function clean(s, max = 1e3) {
	return typeof s === "string" ? s.trim().slice(0, max) : "";
}
async function api(req, env) {
	const u = new URL(req.url), now = Math.floor(Date.now() / 1e3);
	if (u.pathname === "/api/health") return json({
		ok: true,
		service: "SAVIOR",
		time: (/* @__PURE__ */ new Date()).toISOString()
	});
	if (u.pathname === "/api/public/stats") return json({
		activeUnits: 12,
		averageResponse: "8:42",
		partnerHospitals: 9,
		handledToday: 34
	});
	if (u.pathname === "/api/access" && req.method === "POST") {
		const ip = req.headers.get("CF-Connecting-IP") || "unknown";
		const token = ((await req.json().catch(() => ({}))).token || "").toUpperCase().replace(/[^A-Z0-9-]/g, "");
		if (token.length < 6) return json({ error: "Token tidak valid." }, 400);
		const row = await env.DB.prepare("SELECT id,incident_id,expires_at,used_at FROM access_tokens WHERE token_hash=?").bind(await hash(token)).first();
		if (!row || row.used_at || row.expires_at < now) {
			console.log(JSON.stringify({
				event: "token_rejected",
				ip
			}));
			return json({ error: "Token salah, kedaluwarsa, atau sudah digunakan." }, 401);
		}
		const raw = random(), sid = crypto.randomUUID(), expires = now + 7200;
		if (!(await env.DB.batch([env.DB.prepare("UPDATE access_tokens SET used_at=? WHERE id=? AND used_at IS NULL").bind(now, row.id), env.DB.prepare("INSERT INTO sessions(id,session_hash,incident_id,expires_at,created_at) VALUES(?,?,?,?,?)").bind(sid, await hash(raw), row.incident_id, expires, now)]))[0].success) return json({ error: "Token sudah digunakan." }, 409);
		return json({
			ok: true,
			incidentId: row.incident_id
		}, 200, { "Set-Cookie": `savior_session=${raw}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=7200` });
	}
	if (u.pathname === "/api/session" && req.method === "GET") {
		const s = await auth(req, env);
		if (!s) return json({ authenticated: false }, 401);
		return json({
			authenticated: true,
			incident: await env.DB.prepare("SELECT * FROM incidents WHERE id=?").bind(s.incident_id).first()
		});
	}
	if (u.pathname === "/api/report" && req.method === "POST") {
		const s = await auth(req, env);
		if (!s) return json({ error: "Sesi tidak valid." }, 401);
		const f = await req.formData();
		const photo = f.get("photo");
		if (!(photo instanceof File) || !photo.type.startsWith("image/") || photo.size > 8e6) return json({ error: "Bukti kamera wajib, maksimum 8 MB." }, 400);
		const lat = Number(clean(f.get("latitude"), 30)), lng = Number(clean(f.get("longitude"), 30)), accuracy = Number(clean(f.get("accuracy"), 30));
		if (!Number.isFinite(lat) || !Number.isFinite(lng)) return json({ error: "Lokasi GPS wajib." }, 400);
		const evidenceKey = `incidents/${s.incident_id}/${crypto.randomUUID()}.jpg`;
		await env.EVIDENCE.put(evidenceKey, photo.stream(), {
			httpMetadata: { contentType: "image/jpeg" },
			customMetadata: {
				incident: s.incident_id,
				capturedAt: (/* @__PURE__ */ new Date()).toISOString()
			}
		});
		await env.DB.prepare(`UPDATE incidents SET reporter_name=?,reporter_phone=?,victim_count=?,victim_condition=?,description=?,latitude=?,longitude=?,accuracy=?,evidence_key=?,status='laporan_diterima',updated_at=? WHERE id=?`).bind(clean(f.get("reporterName"), 100), clean(f.get("reporterPhone"), 30), Math.max(1, Math.min(20, Number(clean(f.get("victimCount"), 3)) || 1)), clean(f.get("victimCondition"), 100), clean(f.get("description"), 1200), lat, lng, accuracy, evidenceKey, now, s.incident_id).run();
		return json({
			ok: true,
			incidentId: s.incident_id
		});
	}
	if (u.pathname === "/api/logout" && req.method === "POST") {
		const s = await auth(req, env);
		if (s) await env.DB.prepare("UPDATE sessions SET revoked_at=? WHERE id=?").bind(now, s.id).run();
		return json({ ok: true }, 200, { "Set-Cookie": "savior_session=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0" });
	}
	if (u.pathname === "/api/admin/demo-token" && req.method === "POST") {
		const supplied = req.headers.get("x-demo-key");
		if (!supplied || supplied !== "savior-lomba-demo") return json({ error: "Tidak diizinkan." }, 403);
		const token = `SVR-${random(4).toUpperCase()}`, incident = `SMG-${Date.now().toString().slice(-8)}`;
		await env.DB.batch([env.DB.prepare(`INSERT INTO incidents(id,status,created_at,updated_at) VALUES(?,'menunggu_laporan',?,?)`).bind(incident, now, now), env.DB.prepare("INSERT INTO access_tokens(id,token_hash,incident_id,expires_at,created_at) VALUES(?,?,?,?,?)").bind(crypto.randomUUID(), await hash(token), incident, now + 900, now)]);
		return json({
			token,
			incident,
			expiresIn: 900
		});
	}
	return json({ error: "Not found" }, 404);
}
//#endregion
//#region \0virtual:cloudflare/worker-entry
var worker_entry_default = { async fetch(req, env) {
	const u = new URL(req.url);
	try {
		if (u.pathname.startsWith("/api/")) return await api(req, env);
		const target = u.pathname === "/" ? "/index.html" : u.pathname;
		const res = await fetch(`https://nawfdev.github.io/savior-semarang${target}`);
		const h = new Headers(res.headers);
		Object.entries(securityHeaders).forEach(([k, v]) => h.set(k, v));
		return new Response(res.body, {
			status: res.status,
			headers: h
		});
	} catch (error) {
		console.error(JSON.stringify({
			event: "request_error",
			path: u.pathname,
			error: String(error)
		}));
		return json({ error: "Terjadi gangguan layanan." }, 500);
	}
} };
//#endregion
export { worker_entry_default as default };
