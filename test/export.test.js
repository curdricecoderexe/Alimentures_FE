/** Spreadsheet export: valid .xlsx structure, CSV escaping, formula-injection guard. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { unzipSync, strFromU8 } from 'fflate';
import { _internals } from '../src/lib/exportUtils.js';

const rows = [
  { Name: 'Ragi Cookies', Price: 90, Note: '=HYPERLINK("http://evil")' },
  { Name: 'Ghee, "A2"', Price: 450, Note: 'line1\nline2 & <b>' },
];

test('CSV quotes properly and neutralises formulas', () => {
  const csv = _internals.toCsv(rows, _internals.columnsFrom(rows));
  assert.ok(csv.startsWith('﻿Name,Price,Note\r\n'));
  assert.match(csv, /"'=HYPERLINK\(""http:\/\/evil""\)"/);
  assert.match(csv, /"Ghee, ""A2"""/);
});

test('XLSX is a well-formed workbook with escaped, formula-safe cells', async () => {
  const files = unzipSync(await _internals.toXlsx(rows, _internals.columnsFrom(rows)));
  for (const f of ['[Content_Types].xml', 'xl/workbook.xml', 'xl/styles.xml', 'xl/worksheets/sheet1.xml', '_rels/.rels', 'xl/_rels/workbook.xml.rels']) {
    assert.ok(files[f], `missing ${f}`);
  }
  const sheet = strFromU8(files['xl/worksheets/sheet1.xml']);
  assert.match(sheet, /<c r="A1" t="inlineStr" s="1">/, 'bold header');
  assert.match(sheet, /<c r="B2"><v>90<\/v><\/c>/, 'numbers stay numeric');
  assert.match(sheet, /'=HYPERLINK/, 'formula neutralised');
  assert.match(sheet, /&amp; &lt;b&gt;/, 'xml escaped');
  assert.equal((sheet.match(/<row /g) || []).length, 3);
});
