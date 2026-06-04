/* ═══════════════════════════════════════════════════════════
   FEGT MODULE - PDF GENERATION
   ═══════════════════════════════════════════════════════════ */

// ── EFFECTIVE STATUS HELPER
function effectiveStatus(p) {
  if (!p.statusRaw) return 'unknown';
  var s = String(p.statusRaw).toLowerCase();
  if (s.includes('hard')) return 'hard';
  if (s.includes('fail')) return 'fail';
  return 'ok';
}

// ── DOWNLOAD PDF REPORT
function downloadPdf() {
  try {
    var jsPDF = window.jspdf.jsPDF;
    var doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    var pw = doc.internal.pageSize.getWidth();
    var ph = doc.internal.pageSize.getHeight();
    var now = new Date();
    var BULAN = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
    var dd = String(now.getDate()).padStart(2, '0');
    var mmN = BULAN[now.getMonth()];
    var yy = now.getFullYear();
    var hh = String(now.getHours()).padStart(2, '0');
    var mn = String(now.getMinutes()).padStart(2, '0');
    var nowDateStr = dd + ' ' + mmN + ' ' + yy;
    var nowStr = dd + ' ' + mmN + ' ' + yy + '  ' + hh + ':' + mn;

    function cleanDate(val) {
      if (!val || val === '—' || val === '-') return '-';
      if (BULAN.some(function(b) { return String(val).includes(b); })) return String(val);
      var d = new Date(val);
      if (!isNaN(d.getTime()) && d.getFullYear() > 2000) return String(d.getDate()).padStart(2, '0') + ' ' + BULAN[d.getMonth()] + ' ' + d.getFullYear();
      return String(val);
    }

    function safePdf(str) {
      return String(str || '')
        .replace(/\u2192/g, '->').replace(/\u00b0/g, ' C')
        .replace(/\u2014/g, '-').replace(/\u2013/g, '-')
        .replace(/[^\x00-\xFF]/g, '?');
    }

    function checkPage(yPos, need) {
      if (yPos + need > ph - 18) { doc.addPage(); return 20; }
      return yPos;
    }

    var tanggalStr = cleanDate(metaInfo.tanggal);
    var shiftStr = safePdf(metaInfo.shift);
    var operatorStr = safePdf(metaInfo.operator);

    // ── KOP (Header)
    function drawKop() {
      doc.setFillColor(44, 62, 48);
      doc.rect(0, 0, pw, 26, 'F');
      doc.setFillColor(192, 57, 43);
      doc.rect(0, 26, pw, 2, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(15);
      doc.setTextColor(210, 230, 215);
      doc.text('LAPORAN DIAGNOSTIC SENSOR FEGT & LEAK DETECTION', pw / 2, 11, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(140, 185, 155);
      doc.text('PT POMI - PLTU Paiton Unit 7 - Furnace Exit Gas Temperature Monitoring System', pw / 2, 18, { align: 'center' });
      doc.text('Konfigurasi FEGT: 8 Sensor, Pola 3-2-3, 21 Active Paths  |  Leak Detection: 9 Paths', pw / 2, 23, { align: 'center' });
    }
    drawKop();

    // ── INFO BLOCK
    var y = 34;
    doc.setDrawColor(200, 215, 205);
    doc.setLineWidth(0.3);
    doc.rect(12, y, pw - 24, 22, 'S');
    var infoItems = [
      { label: 'Tanggal Data', val: tanggalStr, x: 14 },
      { label: 'Shift', val: shiftStr, x: 14 },
      { label: 'Operator', val: operatorStr, x: 108 },
      { label: 'Dicetak', val: nowStr, x: 108 },
    ];
    [[0, 1], [2, 3]].forEach(function(pair) {
      pair.forEach(function(idx, i) {
        var it = infoItems[idx], iy = y + 8 + i * 7;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(74, 94, 82);
        doc.text(it.label + ':', it.x, iy);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(20, 30, 25);
        doc.text(safePdf(it.val), it.x + 32, iy);
      });
    });
    y += 28;

    function sectionHeader(title, yPos, color) {
      var c = color || [44, 62, 48];
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(c[0], c[1], c[2]);
      doc.text(title, 14, yPos);
      doc.setDrawColor(160, 185, 170);
      doc.setLineWidth(0.4);
      doc.line(14, yPos + 2, pw - 14, yPos + 2);
      return yPos + 7;
    }

    function statBox(items, yPos) {
      var sw2 = (pw - 28 - (items.length - 1) * 3) / items.length;
      items.forEach(function(st, i) {
        var sx = 14 + i * (sw2 + 3);
        doc.setDrawColor(180, 200, 185);
        doc.setLineWidth(0.4);
        doc.rect(sx, yPos, sw2, 11, 'S');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.setTextColor(44, 62, 48);
        doc.text(st.val, sx + sw2 / 2, yPos + 7, { align: 'center' });
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.5);
        doc.setTextColor(100, 120, 110);
        doc.text(st.label, sx + sw2 / 2, yPos + 10.5, { align: 'center' });
      });
      return yPos + 15;
    }

    function conclusionBox(lines, isOk, yPos) {
      var bH = 10 + lines.length * 6;
      yPos = checkPage(yPos, bH + 5);
      doc.setDrawColor(160, 185, 170);
      doc.setLineWidth(0.4);
      doc.rect(14, yPos, pw - 28, bH, 'S');
      doc.setLineWidth(2);
      if (isOk) doc.setDrawColor(39, 174, 96); else doc.setDrawColor(192, 57, 43);
      doc.line(14, yPos, 14, yPos + bH);
      doc.setLineWidth(0.3);
      doc.setDrawColor(160, 185, 170);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      if (isOk) doc.setTextColor(27, 120, 66); else doc.setTextColor(150, 40, 30);
      doc.text(lines[0], 20, yPos + 7);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(40, 60, 45);
      lines.slice(1).forEach(function(line, i) {
        if (line) doc.text(safePdf(line), 20, yPos + 13 + i * 6);
      });
      return yPos + bH + 8;
    }

    // ══════════════════════════════════════════
    // SECTION 1 — FEGT
    // ══════════════════════════════════════════
    y = checkPage(y, 20);
    doc.setFillColor(44, 62, 48);
    doc.rect(14, y, pw - 28, 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(210, 230, 215);
    doc.text('BAGIAN 1 — FEGT (Furnace Exit Gas Temperature)', pw / 2, y + 5, { align: 'center' });
    y += 11;

    // FEGT Stats
    y = sectionHeader('DATA PEMBACAAN PATH FEGT (21 PATH)', y);
    var statOk = pathData.filter(function(p) { return effectiveStatus(p) === 'ok'; }).length;
    var statFail = pathData.filter(function(p) { return effectiveStatus(p) === 'fail'; }).length;
    var statHard = pathData.filter(function(p) { return effectiveStatus(p) === 'hard'; }).length;
    y = statBox([{ label: 'Total Paths', val: '21' }, { label: 'Valid / OK', val: String(statOk) }, { label: 'Data Fail', val: String(statFail) }, { label: 'Hard Fail', val: String(statHard) }], y);

    // FEGT Path Table
    var tableRows = pathData.map(function(p) {
      var eff = effectiveStatus(p);
      return ['Path-' + p.id, p.tx + '->' + p.rx, p.temp > 0 ? p.temp + ' C' : '0 / No Read', safePdf(p.statusRaw) || '-', eff === 'ok' ? 'VALID' : eff === 'fail' ? 'DATA FAIL' : eff === 'hard' ? 'HARD FAIL' : '-'];
    });
    doc.autoTable({
      startY: y,
      head: [['Path', 'Tx->Rx', 'Reading Temp', 'Status Input', 'Keterangan']],
      body: tableRows,
      theme: 'grid',
      margin: { left: 14, right: 14 },
      headStyles: { fillColor: [44, 62, 48], textColor: [210, 230, 215], fontStyle: 'bold', fontSize: 8, halign: 'center', font: 'helvetica' },
      bodyStyles: { fontSize: 8, textColor: [20, 30, 25], halign: 'center', font: 'helvetica' },
      columnStyles: { '0': { cellWidth: 18 }, 1: { cellWidth: 16 }, 2: { cellWidth: 26 }, 3: { cellWidth: 82 }, 4: { cellWidth: 40 } },
      alternateRowStyles: { fillColor: [246, 249, 247] },
    });
    y = doc.lastAutoTable.finalY + 8;

    // Sensor Diagnosis Table
    y = checkPage(y, 40);
    y = sectionHeader('HASIL DIAGNOSIS SENSOR FEGT', y);
    var sensorRows = [];
    for (var s = 1; s <= 8; s++) {
      var r = diagResults[s] || { verdict: 'unknown', reason: '-' };
      var verdict = r.verdict === 'ok' ? 'OPERASIONAL' : r.verdict === 'warning' ? 'PERLU CEK' : r.verdict === 'hard' ? 'BERMASALAH' : 'NO DATA';
      sensorRows.push(['Sensor ' + s, verdict, safePdf(r.reason || '-')]);
    }
    doc.autoTable({
      startY: y,
      head: [['Sensor', 'Status', 'Keterangan Diagnosis']],
      body: sensorRows,
      theme: 'grid',
      margin: { left: 14, right: 14 },
      headStyles: { fillColor: [44, 62, 48], textColor: [210, 230, 215], fontStyle: 'bold', fontSize: 8, halign: 'center', font: 'helvetica' },
      bodyStyles: { fontSize: 8, textColor: [20, 30, 25], font: 'helvetica' },
      columnStyles: { '0': { cellWidth: 22, halign: 'center' }, 1: { cellWidth: 30, halign: 'center' }, 2: { cellWidth: 130 } },
      alternateRowStyles: { fillColor: [246, 249, 247] },
      didParseCell: function(data) { if (data.section === 'body' && data.column.index === 1) data.cell.styles.fontStyle = 'bold'; }
    });
    y = doc.lastAutoTable.finalY + 8;

    // FEGT Kesimpulan
    var faulty2 = Object.entries(diagResults).filter(function(e) { return e[1].verdict === 'hard'; }).map(function(e) { return 'Sensor ' + e[0]; });
    var suspect2 = Object.entries(diagResults).filter(function(e) { return e[1].verdict === 'warning'; }).map(function(e) { return 'Sensor ' + e[0]; });
    var fEgtOk = faulty2.length === 0 && suspect2.length === 0;
    var fEgtLines = [];
    if (fEgtOk) {
      fEgtLines = ['KESIMPULAN FEGT: Semua Sensor Operasional', 'Tidak ditemukan indikasi kerusakan sensor. Sistem FEGT berfungsi normal.'];
    } else {
      fEgtLines = ['KESIMPULAN FEGT: Terdeteksi Indikasi Kerusakan Sensor'];
      if (faulty2.length > 0) fEgtLines.push('Sensor kemungkinan besar bermasalah: ' + faulty2.join(', '));
      if (suspect2.length > 0) fEgtLines.push('Sensor perlu pengecekan lanjut: ' + suspect2.join(', '));
      if (faulty2.length > 0) fEgtLines.push('Indikasi: stub pipe tersumbat fly ash atau transmitter melemah.');
      if (suspect2.length > 0) fEgtLines.push('Lakukan cross-check dengan data shift lain untuk konfirmasi.');
    }
    y = conclusionBox(fEgtLines, fEgtOk, y);

    // ══════════════════════════════════════════
    // SECTION 2 — LEAK DETECTION
    // ══════════════════════════════════════════
    y = checkPage(y, 20);
    doc.setFillColor(44, 62, 48);
    doc.rect(14, y, pw - 28, 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(210, 230, 215);
    doc.text('BAGIAN 2 — LEAK DETECTION (LD)', pw / 2, y + 5, { align: 'center' });
    y += 11;

    // Leak data
    var leakResults = LEAK_PATHS.map(function(p) {
      var temp = parseFloat(document.getElementById('lktemp-' + p.id).value) || 0;
      var status = document.getElementById('lkstatus-' + p.id).value || (p.defaultNA ? 'na' : 'ok');
      return Object.assign({}, p, { temp: temp, status: status });
    });
    var lkOk = 0, lkFail = 0, lkHard = 0, lkNa = 0;
    leakResults.forEach(function(r) {
      if (r.status === 'na') lkNa++;
      else if (r.status === 'ok') lkOk++;
      else if (r.status.includes('hard')) lkHard++;
      else lkFail++;
    });

    // Leak Stats
    y = sectionHeader('DATA PEMBACAAN LEAK DETECTION (9 PATH)', y);
    y = statBox([{ label: 'Total Paths', val: '9' }, { label: 'OK', val: String(lkOk) }, { label: 'Fail', val: String(lkFail + lkHard) }, { label: 'N/A', val: String(lkNa) }], y);

    // Leak Path Table
    var leakTableRows = leakResults.map(function(r) {
      var tempStr = r.status === 'na' ? 'N/A' : (r.temp > 0 ? r.temp + ' C' : '0 / No Read');
      var statusLabel = r.status === 'na' ? 'N/A' : r.status === 'ok' ? 'OK / Valid' : r.status === 'data fail' ? 'Data Fail' : r.status === 'hard fail' ? 'Hard Fail' : safePdf(r.status);
      var ket = r.status === 'na' ? 'N/A' : r.status === 'ok' ? 'NORMAL' : r.status.includes('hard') ? 'HARD FAIL' : 'DATA FAIL';
      return ['Path-' + r.id, safePdf(r.desc), tempStr, statusLabel, ket];
    });
    doc.autoTable({
      startY: y,
      head: [['Path', 'Lokasi / Keterangan', 'Reading Temp', 'Status Input', 'Keterangan']],
      body: leakTableRows,
      theme: 'grid',
      margin: { left: 14, right: 14 },
      headStyles: { fillColor: [44, 62, 48], textColor: [210, 230, 215], fontStyle: 'bold', fontSize: 8, halign: 'center', font: 'helvetica' },
      bodyStyles: { fontSize: 8, textColor: [20, 30, 25], halign: 'center', font: 'helvetica' },
      columnStyles: { '0': { cellWidth: 16 }, 1: { cellWidth: 76 }, 2: { cellWidth: 24 }, 3: { cellWidth: 36 }, 4: { cellWidth: 30 } },
      alternateRowStyles: { fillColor: [246, 249, 247] },
    });
    y = doc.lastAutoTable.finalY + 8;

    // Leak Kesimpulan
    var lkIssues = leakResults.filter(function(r) { return r.status.includes('fail') || r.status.includes('hard'); });
    var lkAllOk = lkIssues.length === 0;
    var lkLines = [];
    if (lkAllOk) {
      lkLines = ['KESIMPULAN LEAK DETECTION: Tidak Ada Indikasi Kebocoran', 'Semua path aktif terbaca normal. Tidak ada indikasi kebocoran terdeteksi.'];
    } else {
      lkLines = ['KESIMPULAN LEAK DETECTION: Terdeteksi Indikasi Kebocoran'];
      lkLines.push('Path bermasalah: ' + lkIssues.map(function(r) { return 'Path-' + r.id; }).join(', '));
      lkLines.push('Lakukan inspeksi fisik pada path yang menunjukkan Data Fail atau Hard Fail.');
    }
    y = conclusionBox(lkLines, lkAllOk, y);

    // ══════════════════════════════════════════
    // TANDA TANGAN
    // ══════════════════════════════════════════
    y = checkPage(y, 22);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(80, 100, 85);
    doc.text('Diperiksa oleh,', pw - 70, y);
    doc.text('Probolinggo, ' + nowDateStr, pw - 70, y + 5);
    var opLabel = (operatorStr && operatorStr !== '-' && operatorStr !== '?') ? operatorStr : '(Nama Operator)';
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(20, 30, 25);
    doc.text(opLabel, pw - 42, y + 13, { align: 'center' });

    // ── FOOTER (all pages)
    var totalPages = doc.internal.getNumberOfPages();
    for (var i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setDrawColor(160, 185, 170);
      doc.setLineWidth(0.3);
      doc.line(14, ph - 12, pw - 14, ph - 12);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(100, 130, 110);
      doc.text('FEGT & Leak Detection Diagnostic System - PLTU Paiton Unit 7 - PT POMI', 14, ph - 7);
      doc.text('Halaman ' + i + ' / ' + totalPages, pw - 14, ph - 7, { align: 'right' });
      doc.text('Dicetak: ' + nowStr, pw / 2, ph - 7, { align: 'center' });
    }

    var dateTag = yy + String(now.getMonth() + 1).padStart(2, '0') + dd;
    var shiftTag = (shiftStr && shiftStr !== '-' && shiftStr !== '?') ? '_' + shiftStr.replace(/\s/g, '') : '';
    doc.save('FEGT_LD_Report_' + dateTag + shiftTag + '.pdf');
  } catch (err) {
    alert('PDF Error: ' + err.message);
    console.error(err);
  }
}
