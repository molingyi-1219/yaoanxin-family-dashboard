const toast = document.getElementById('toast');
const initialState = { activeBoxId: 'box-li', boxes: [
  { id: 'box-li', boxName: '李秀兰的药盒', name: '李秀兰', gender: '女', age: 68, condition: '高血压长期管理', location: '客厅', device: '药盒 A-032', medicines: [
    { id: 1, name: '厄贝沙坦片', slot: 'A1', count: 24, threshold: 7, time: '08:00', dose: 1, instruction: '早饭后', status: 'complete' },
    { id: 2, name: '阿托伐他汀钙片', slot: 'B2', count: 15, threshold: 7, time: '12:30', dose: 1, instruction: '午饭后', status: 'complete' },
    { id: 3, name: '氨氯地平片', slot: 'C3', count: 5, threshold: 7, time: '20:00', dose: 1, instruction: '睡前', status: 'pending' }
  ] },
  { id: 'box-wang', boxName: '王建国的药盒', name: '王建国', gender: '男', age: 72, condition: '糖尿病日常管理', location: '卧室', device: '药盒 B-118', medicines: [
    { id: 11, name: '二甲双胍片', slot: 'A2', count: 18, threshold: 8, time: '07:30', dose: 2, instruction: '早饭后', status: 'complete' },
    { id: 12, name: '阿卡波糖片', slot: 'B1', count: 9, threshold: 7, time: '12:00', dose: 1, instruction: '随午餐', status: 'pending' }
  ] }
] };
let state = JSON.parse(localStorage.getItem('yaoanxinFamilyState') || 'null') || initialState;
state.boxes.forEach(box => box.medicines.forEach(medicine => { medicine.dose ||= 1; medicine.time ||= '20:00'; medicine.instruction ||= '按医嘱'; }));
const current = () => state.boxes.find(box => box.id === state.activeBoxId) || state.boxes[0];
const save = () => localStorage.setItem('yaoanxinFamilyState', JSON.stringify(state));
const low = box => box.medicines.filter(medicine => medicine.count <= medicine.threshold);
function showToast(message) { toast.textContent = message; toast.classList.add('show'); clearTimeout(showToast.timer); showToast.timer = setTimeout(() => toast.classList.remove('show'), 3000); }
function safe(value) { return String(value).replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char]); }

function addMedicationFields() {
  const doseRow = document.createElement('div'); doseRow.className = 'form-row';
  doseRow.innerHTML = '<label>每日服药时间<input id="medicineTime" required type="time" value="20:00"/></label><label>每次剂量（片/粒）<input id="medicineDose" required type="number" min="1" max="99" value="1"/></label>';
  medicineThreshold.closest('label').before(doseRow);
  const scan = document.createElement('section'); scan.className = 'scan-panel';
  scan.innerHTML = '<div><strong>扫码导入药品</strong><small>拍摄或上传药品包装条码；识别后仍需确认剂量与时间。</small></div><button type="button" class="outline-button scan-button" id="scanButton">▣ 扫描条形码</button><input id="barcodeFile" type="file" accept="image/*" capture="environment" hidden/><p id="scanStatus" class="scan-status">当前为本地原型，不会上传药盒或患者数据。</p>';
  medicineForm.insertBefore(scan, medicineName.closest('label'));
  scanButton.onclick = () => barcodeFile.click();
  barcodeFile.onchange = event => scanBarcode(event.target.files[0]);
}
async function scanBarcode(file) {
  if (!file) return;
  scanStatus.textContent = '正在识别包装条码…';
  if (!('BarcodeDetector' in window)) { scanStatus.textContent = '当前浏览器不支持条码识别；请改用手机 Chrome/Edge，或手动录入。'; return; }
  try {
    const image = await createImageBitmap(file); const detector = new BarcodeDetector({ formats: ['ean_13', 'ean_8', 'code_128', 'upc_a', 'upc_e'] }); const results = await detector.detect(image);
    if (!results.length) { scanStatus.textContent = '没有识别到清晰条码，请对准条码重新拍摄。'; return; }
    const code = results[0].rawValue; const ageTip = current().age >= 65 ? '当前为长者档案：请以医生/药师确认剂量为准。' : '请以处方或药师说明确认剂量。';
    scanStatus.textContent = `已读到条码 ${code}。${ageTip}`;
    medicineName.placeholder = `已识别条码：${code}（请确认药名）`;
    medicineName.dataset.barcode = code;
  } catch { scanStatus.textContent = '识别失败，请使用更清晰、光线充足的包装照片。'; }
}
function renderTabs() { boxTabs.querySelectorAll('.box-tab').forEach(tab => tab.remove()); state.boxes.forEach(box => { const tab = document.createElement('button'); tab.type = 'button'; tab.className = `box-tab ${box.id === state.activeBoxId ? 'active' : ''}`; tab.innerHTML = `<span class="box-dot"></span><strong>${safe(box.boxName)}</strong><small>${safe(box.location)} · 在线</small>`; tab.onclick = () => { state.activeBoxId = box.id; save(); render(); showToast(`正在查看：${box.boxName}`); }; boxTabs.insertBefore(tab, openBoxModalSecondary); }); }
function renderProfile() { const box = current(), pending = box.medicines.find(medicine => medicine.status === 'pending') || box.medicines[0], done = box.medicines.filter(medicine => medicine.status === 'complete').length; personName.textContent = box.name; personInitial.textContent = box.name.charAt(0); personInfo.textContent = `${box.gender} · ${box.age} 岁 · ${box.condition}`; deviceId.textContent = box.device; nextDoseTime.textContent = pending ? `今天 ${pending.time}` : '今日已完成'; nextDoseInfo.textContent = pending ? `${pending.name} · 自动出药 ${pending.dose} 片 · ${pending.slot} 格` : '请按医嘱继续管理'; progressNumber.textContent = `${done}/${box.medicines.length}`; progressTitle.textContent = `今天已完成 ${done} 次用药`; progressText.textContent = pending ? `下一次为 ${pending.time}，药盒将自动弹出 ${pending.dose} 片${pending.name}。` : '今日药品均已确认。'; }
function renderSchedule() { const box = current(); scheduleList.innerHTML = box.medicines.map((medicine, index) => `<div class="medicine-row ${medicine.status === 'complete' ? 'complete' : 'pending'}"><div class="time">${medicine.time}</div><div class="medicine-icon ${index % 3 === 0 ? 'blue' : index % 3 === 1 ? 'mint' : 'amber'}">${index % 3 === 0 ? '●' : index % 3 === 1 ? '◆' : '▲'}</div><div class="medicine-detail"><strong>${safe(medicine.name)}</strong><span>每次 ${medicine.dose} 片 · ${safe(medicine.instruction)} · ${safe(medicine.slot)} 格</span></div><div class="state">${medicine.status === 'complete' ? '<span class="check">✓</span><strong>已确认</strong><small>已同步</small>' : `<span class="waiting">◷</span><strong>待提醒</strong><small>将自动弹出 ${medicine.dose} 片</small>`}</div></div>`).join('') || '<p class="section-subline">这个药盒还没有药品，点击“添加药品”开始设置。</p>'; }
function renderInventory() { const box = current(), lows = low(box); inventoryList.innerHTML = box.medicines.map(medicine => { const isLow = medicine.count <= medicine.threshold, percent = Math.min(100, Math.round(medicine.count / Math.max(medicine.threshold * 3, 1) * 100)); return `<div class="inventory-row"><span class="slot">${safe(medicine.slot)}</span><div class="medicine-name"><strong>${safe(medicine.name)}</strong><small>${medicine.time} · 每次 ${medicine.dose} 片 · 低库存提醒：${medicine.threshold} 片</small></div><div class="inventory-meta"><strong>${medicine.count} 片可用 ${isLow ? '· 建议补货' : '· 库存充足'}</strong><div class="stock-track"><span class="stock-fill ${isLow ? 'low' : ''}" style="width:${percent}%"></span></div></div><div class="inventory-actions"><button class="edit-button" data-edit="${medicine.id}">编辑</button><a class="buy-link" href="https://i.meituan.com/" target="_blank" rel="noopener">买药↗</a></div></div>`; }).join('') || '<p class="section-subline">暂无药品，请添加。</p>'; lowCount.textContent = `${lows.length} 项`; lowTitle.textContent = lows.length ? `${lows[0].name}余量不足` : '当前库存充足'; lowText.textContent = lows.length ? `「${box.name}」的药盒中，${lows.map(medicine => medicine.name).join('、')}达到提醒线，建议提前补充。` : `「${box.name}」的药品余量均高于提醒线。`; document.querySelectorAll('[data-edit]').forEach(button => button.onclick = () => editMedicine(Number(button.dataset.edit))); }
function render() { renderTabs(); renderProfile(); renderSchedule(); renderInventory(); }
function open(id) { document.getElementById(id).hidden = false; } function close(id) { document.getElementById(id).hidden = true; }
function editMedicine(id) { const medicine = current().medicines.find(item => item.id === id); medicineModalTitle.textContent = '编辑药品'; medicineId.value = medicine.id; medicineName.value = medicine.name; medicineSlot.value = medicine.slot; medicineCount.value = medicine.count; medicineThreshold.value = medicine.threshold; medicineTime.value = medicine.time; medicineDose.value = medicine.dose; scanStatus.textContent = '可重新扫描包装条码；修改须经处方或药师确认。'; open('medicineModal'); }

addMedicationFields();
openBoxModal.onclick = () => open('boxModal'); openBoxModalSecondary.onclick = () => open('boxModal');
openMedicineModal.onclick = () => { medicineForm.reset(); medicineId.value = ''; medicineTime.value = '20:00'; medicineDose.value = 1; medicineName.dataset.barcode = ''; medicineName.placeholder = '例如：维生素 D3'; scanStatus.textContent = '当前为本地原型，不会上传药盒或患者数据。'; medicineModalTitle.textContent = '添加药品'; open('medicineModal'); };
document.querySelectorAll('[data-close]').forEach(button => button.onclick = () => close(button.dataset.close)); document.querySelectorAll('.modal-backdrop').forEach(backdrop => backdrop.onclick = event => { if (event.target === backdrop) close(backdrop.id); });
boxForm.onsubmit = event => { event.preventDefault(); const box = { id: `box-${Date.now()}`, boxName: boxName.value.trim(), name: profileName.value.trim(), gender: profileGender.value, age: Number(profileAge.value), condition: profileCondition.value.trim(), location: boxLocation.value.trim(), device: `药盒 ${String.fromCharCode(65 + state.boxes.length)}-${Math.floor(100 + Math.random() * 900)}`, medicines: [] }; state.boxes.push(box); state.activeBoxId = box.id; save(); render(); close('boxModal'); event.target.reset(); showToast(`已创建 ${box.name} 的独立档案，现在可添加专属药品。`); };
medicineForm.onsubmit = event => { event.preventDefault(); const box = current(), id = Number(medicineId.value), old = box.medicines.find(item => item.id === id), medicine = { id: id || Date.now(), name: medicineName.value.trim(), slot: medicineSlot.value.trim().toUpperCase(), count: Number(medicineCount.value), threshold: Number(medicineThreshold.value), time: medicineTime.value, dose: Number(medicineDose.value), barcode: medicineName.dataset.barcode || old?.barcode || '', instruction: old?.instruction || '按医嘱', status: old?.status || 'pending' }; box.medicines = id ? box.medicines.map(item => item.id === id ? medicine : item) : [...box.medicines, medicine]; save(); render(); close('medicineModal'); showToast(id ? '药品时间与剂量已更新。' : `已为 ${box.name} 添加专属药品。`); };
brightnessSetting.oninput = event => brightnessValue.textContent = `${event.target.value}%`; saveSettings.onclick = () => showToast(`已保存 ${current().name} 的提醒：${soundSetting.value}，灯光 ${brightnessSetting.value}%`); contactButton.onclick = () => showToast(`已打开联系 ${current().name} 家人的方式。`); recordButton.onclick = () => inventory.scrollIntoView({ behavior: 'smooth' }); notificationButton.onclick = () => showToast(low(current()).length ? `「${current().name}」有 ${low(current()).length} 种药品需要关注。` : '暂无需要立即处理的新提醒。'); helpButton.onclick = () => showToast('每个药盒都有独立人物档案、药品库存和用药安排。');
const mobileStyle = document.createElement('style'); mobileStyle.textContent = '.scan-panel{margin:16px 0;padding:13px;border:1px dashed #9accc3;border-radius:10px;background:#f2faf8}.scan-panel strong,.scan-panel small{display:block}.scan-panel small,.scan-status{font-size:12px;color:#70848a;line-height:1.55;margin:5px 0}.scan-button{margin-top:8px;font-size:13px;padding:8px 11px}@media(max-width:630px){.scan-panel{padding:12px}.modal{padding:21px}.top-actions{width:100%;justify-content:space-between}.box-tab{min-width:154px}.medicine-row{gap:9px}.medicine-detail span{font-size:11px}}'; document.head.appendChild(mobileStyle);
render();

