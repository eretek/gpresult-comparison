/*! Eretek Online Araçlar #39 — GPO Sonuç Karşılaştırıcı */
ERT.def('39', {
	run: function (v, c) {
		var X = ERT.xml;
		var load = function (src, f) {
			var doc; if (!src || !String(src).trim()) { throw c.fe(f, 'req'); }
			try { doc = X.parse(src); } catch (e) { throw c.fe(f, e.message === 'doctype' ? 'doctype' : 'badXml'); }
			var out = new Map(), meta = {};
			['ComputerResults', 'UserResults'].forEach(function (scope) {
				var sc = X.deep(doc, scope)[0]; if (!sc) { return; }
				meta[scope] = X.txt(sc, 'Name');
				X.all(sc, 'GPO').forEach(function (g) {
					var guid = (X.txt(g, 'Path/Identifier') || X.txt(g, 'Identifier') || X.txt(g, 'Name')).toLowerCase();
					var b = function (n) { var t = X.txt(g, n); return t === '' ? null : /true/i.test(t); };
					var en = b('Enabled'), fa = b('FilterAllowed'), ad = b('AccessDenied'), iv = b('IsValid');
					var applied = en !== false && fa !== false && ad !== true && iv !== false;
					out.set(scope + '|' + guid, { scope: scope, guid: guid, name: X.txt(g, 'Name'), applied: applied, why: [en === false ? 'disabled' : '', fa === false ? 'filtered' : '', ad === true ? 'denied' : '', iv === false ? 'invalid' : ''].filter(Boolean).join(','), link: X.txt(g, 'Link/SOMPath') });
				});
			});
			if (!out.size) { throw c.fe(f, 'noGpo'); }
			return { m: out, meta: meta };
		};
		var A = load(v.a, 'a'), B = load(v.b, 'b'), rows = [], cls = [], cnt = { onlyA: 0, onlyB: 0, state: 0, name: 0, same: 0 };
		var st = function (g) { return g.applied ? c.t('applied') : c.t('notApplied') + (g.why ? ' (' + g.why.split(',').map(function (w) { return c.t('w_' + w); }).join(', ') + ')' : ''); };
		var keys = Array.from(new Set(Array.from(A.m.keys()).concat(Array.from(B.m.keys()))));
		keys.forEach(function (k) {
			var a = A.m.get(k), b = B.m.get(k), sc = k.split('|')[0] === 'ComputerResults' ? c.t('comp') : c.t('user');
			if (a && !b) { cnt.onlyA++; rows.push([sc, a.name, a.guid, st(a), '–', c.t('onlyA')]); cls.push('warn'); }
			else if (!a && b) { cnt.onlyB++; rows.push([sc, b.name, b.guid, '–', st(b), c.t('onlyB')]); cls.push('warn'); }
			else if (a.applied !== b.applied) { cnt.state++; rows.push([sc, b.name, a.guid, st(a), st(b), c.t('stateDiff')]); cls.push('err'); }
			else if (a.name !== b.name) { cnt.name++; rows.push([sc, a.name + ' → ' + b.name, a.guid, st(a), st(b), c.t('nameDiff')]); cls.push('info'); }
			else { cnt.same++; }
		});
		var cols = [c.t('c_scope'), 'GPO', c.t('c_id'), 'A', 'B', c.t('c_res')];
		return { big: c.t('sum', cnt), kv: [[c.t('metaA'), (A.meta.ComputerResults || '–') + ' / ' + (A.meta.UserResults || '–')], [c.t('metaB'), (B.meta.ComputerResults || '–') + ' / ' + (B.meta.UserResults || '–')]], msgs: [['info', c.t('unknownNote')]], tables: rows.length ? [{ cols: cols, rows: rows, cls: cls }] : [], x: rows.length ? { csv: { name: 'gpresult-diff', cols: cols, rows: rows } } : {}, v: cnt };
	}
});
