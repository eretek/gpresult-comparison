/*! Eretek — güvenli, en küçük XML ayrıştırıcı. DOCTYPE/ENTITY reddedilir, dış kaynak yüklenmez, yalnız 5 ön tanımlı ve sayısal karakter
 * başvurusu çözülür. Çıktı: {name, attrs, kids:[...], text} ağacı. Ad alanı önekleri korunur; ERT.xml.local() önek olmadan karşılaştırır. */
(function (root) {
	'use strict';
	var ERT = root.ERT = root.ERT || {};
	var ENT = { lt: '<', gt: '>', amp: '&', quot: '"', apos: "'" };
	function dec(s) {
		return s.replace(/&(#x[0-9a-fA-F]+|#\d+|\w+);/g, function (m, e) {
			if (e[0] === '#') { var n = e[1] === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10); return n > 0 && n < 0x110000 ? String.fromCodePoint(n) : ''; }
			return ENT[e] !== undefined ? ENT[e] : m;
		});
	}
	function XmlError(msg) { this.message = msg; }
	function parse(src, maxNodes) {
		src = String(src || '').replace(/^﻿/, '');
		if (/<!DOCTYPE/i.test(src) || /<!ENTITY/i.test(src)) { throw new XmlError('doctype'); }
		var i = 0, n = src.length, stack = [{ name: '#doc', attrs: {}, kids: [], text: '' }], count = 0;
		maxNodes = maxNodes || 500000;
		while (i < n) {
			var lt = src.indexOf('<', i);
			if (lt === -1) { stack[stack.length - 1].text += dec(src.slice(i)); break; }
			if (lt > i) { stack[stack.length - 1].text += dec(src.slice(i, lt)); }
			if (src.startsWith('<!--', lt)) { var ce = src.indexOf('-->', lt); if (ce < 0) { throw new XmlError('comment'); } i = ce + 3; continue; }
			if (src.startsWith('<![CDATA[', lt)) { var cd = src.indexOf(']]>', lt); if (cd < 0) { throw new XmlError('cdata'); } stack[stack.length - 1].text += src.slice(lt + 9, cd); i = cd + 3; continue; }
			if (src.startsWith('<?', lt)) { var pe = src.indexOf('?>', lt); if (pe < 0) { throw new XmlError('pi'); } i = pe + 2; continue; }
			if (src[lt + 1] === '!') { throw new XmlError('decl'); }
			var gt = lt + 1, q = null;
			while (gt < n) { var ch = src[gt]; if (q) { if (ch === q) { q = null; } } else if (ch === '"' || ch === "'") { q = ch; } else if (ch === '>') { break; } gt++; }
			if (gt >= n) { throw new XmlError('eof'); }
			var tag = src.slice(lt + 1, gt);
			if (tag[0] === '/') {
				var nm = tag.slice(1).trim(), top = stack.pop();
				if (!top || top.name !== nm) { throw new XmlError('mismatch:' + nm); }
				i = gt + 1; continue;
			}
			var self = tag[tag.length - 1] === '/'; if (self) { tag = tag.slice(0, -1); }
			var m = /^([^\s]+)\s*([\s\S]*)$/.exec(tag); if (!m) { throw new XmlError('tag'); }
			var el = { name: m[1], attrs: {}, kids: [], text: '' }, ar = /([^\s=]+)\s*=\s*("([^"]*)"|'([^']*)')/g, am;
			while ((am = ar.exec(m[2]))) { el.attrs[am[1]] = dec(am[3] !== undefined ? am[3] : am[4]); }
			if (++count > maxNodes) { throw new XmlError('size'); }
			stack[stack.length - 1].kids.push(el);
			if (!self) { stack.push(el); }
			i = gt + 1;
		}
		if (stack.length !== 1) { throw new XmlError('unclosed'); }
		return stack[0];
	}
	function local(name) { var k = name.indexOf(':'); return k < 0 ? name : name.slice(k + 1); }
	/** Yoldaki ilk alt düğüm(ler): find(el, 'a/b') ; all(el, 'record') */
	function find(el, path) { var p = path.split('/'), cur = el; for (var i = 0; i < p.length && cur; i++) { cur = cur.kids.filter(function (k) { return local(k.name) === p[i]; })[0]; } return cur || null; }
	function all(el, name) { return el ? el.kids.filter(function (k) { return local(k.name) === name; }) : []; }
	function deep(el, name, out) { out = out || []; (el.kids || []).forEach(function (k) { if (local(k.name) === name) { out.push(k); } deep(k, name, out); }); return out; }
	function txt(el, path) { var e = path ? find(el, path) : el; return e ? e.text.trim() : ''; }
	ERT.xml = { parse: parse, local: local, find: find, all: all, deep: deep, txt: txt, XmlError: XmlError };
}(typeof window !== 'undefined' ? window : globalThis));
