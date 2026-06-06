/* ===================================================
   Z&Z Logistics — Client Application
   =================================================== */

// ──────────────────────────────────────────────────
// SAMPLE DATA
// ──────────────────────────────────────────────────

let drivers = [
  { id: 1, name: 'أحمد الريفاي',    phone: '+49 176 11223344', area: 'Köln Nord',  status: 'on_route',  orders: 28, delivered: 25 },
  { id: 2, name: 'عمر حسن',         phone: '+49 176 22334455', area: 'Köln Süd',   status: 'on_route',  orders: 31, delivered: 29 },
  { id: 3, name: 'مصطفى يلماز',    phone: '+49 176 33445566', area: 'Düsseldorf', status: 'available', orders: 22, delivered: 20 },
  { id: 4, name: 'بيتر شميدت',     phone: '+49 176 44556677', area: 'Bonn',        status: 'on_route',  orders: 19, delivered: 17 },
  { id: 5, name: 'علي كريمي',      phone: '+49 176 55667788', area: 'Aachen',      status: 'off',       orders: 14, delivered: 13 },
];

let orders = [
  { id: 1,  tracking: 'ZZ-10241', customer: 'Klaus Müller',       address: 'Aachener Str. 45, Köln 50674',       driver: 1, status: 'delivered',  time: '08:12', notes: '' },
  { id: 2,  tracking: 'ZZ-10242', customer: 'Fatima Al-Hassan',   address: 'Venloer Str. 12, Köln 50672',        driver: 1, status: 'delivered',  time: '08:45', notes: 'الباب الخلفي' },
  { id: 3,  tracking: 'ZZ-10243', customer: 'Thomas Wagner',      address: 'Sülzgürtel 88, Köln 50937',          driver: 2, status: 'in_transit', time: '09:00', notes: '' },
  { id: 4,  tracking: 'ZZ-10244', customer: 'Selin Yilmaz',       address: 'Ehrenfelder Gürtel 7, Köln 50823',   driver: 2, status: 'delivered',  time: '09:30', notes: '' },
  { id: 5,  tracking: 'ZZ-10245', customer: 'Hamid Karimi',       address: 'Gladbacher Str. 55, Düsseldorf',     driver: 3, status: 'pending',    time: '10:00', notes: 'اتصل قبل الوصول' },
  { id: 6,  tracking: 'ZZ-10246', customer: 'Anna Schmidt',       address: 'Breite Str. 22, Bonn 53111',         driver: 4, status: 'in_transit', time: '09:15', notes: '' },
  { id: 7,  tracking: 'ZZ-10247', customer: 'Mohammed Saleh',     address: 'Elisenstr. 3, Aachen 52062',         driver: 5, status: 'delivered',  time: '07:55', notes: '' },
  { id: 8,  tracking: 'ZZ-10248', customer: 'Laura Braun',        address: 'Friedrich-Ebert-Str. 9, Bonn 53113', driver: 4, status: 'failed',     time: '10:20', notes: 'لم يُرَد عليه' },
  { id: 9,  tracking: 'ZZ-10249', customer: 'Yusuf Demir',        address: 'Neumarkt 18, Köln 50667',             driver: 1, status: 'in_transit', time: '10:35', notes: '' },
  { id: 10, tracking: 'ZZ-10250', customer: 'Sandra Koch',        address: 'Brehmstr. 41, Düsseldorf 40239',     driver: 3, status: 'pending',    time: '11:00', notes: '' },
  { id: 11, tracking: 'ZZ-10251', customer: 'Khalid Mansour',     address: 'Hohenzollernring 4, Köln 50672',     driver: 2, status: 'delivered',  time: '11:15', notes: '' },
  { id: 12, tracking: 'ZZ-10252', customer: 'Maria Fischer',      address: 'Kölner Str. 77, Bonn 53111',         driver: 4, status: 'pending',    time: '11:30', notes: 'صندوق ثقيل' },
];

let nextOrderId  = 13;
let nextDriverId = 6;
let currentUser  = null;
let activeFilter = { query: '', status: '' };

// ──────────────────────────────────────────────────
// AUTH
// ──────────────────────────────────────────────────

async function sendCode() {
  const email = $('email').value.trim();
  const msg   = $('msg');
  msg.textContent = 'جاري إرسال الرمز...';
  msg.style.color = 'var(--muted)';
  try {
    const res  = await fetch('/api/send-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const data = await res.json();
    msg.textContent = data.message;
    msg.style.color = data.ok ? 'var(--green)' : 'var(--red)';
    if (data.ok) $('codeArea').classList.remove('hidden');
  } catch (e) {
    msg.textContent = 'تعذّر الاتصال بالخادم';
    msg.style.color = 'var(--red)';
  }
}

async function verifyCode() {
  const email = $('email').value.trim();
  const code  = $('code').value.trim();
  const msg   = $('msg');
  try {
    const res  = await fetch('/api/verify-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code })
    });
    const data = await res.json();
    msg.textContent = data.message;
    msg.style.color = data.ok ? 'var(--green)' : 'var(--red)';
    if (data.ok) launchApp(email);
  } catch (e) {
    msg.textContent = 'تعذّر الاتصال بالخادم';
    msg.style.color = 'var(--red)';
  }
}

async function logout() {
  await fetch('/api/logout', { method: 'POST' });
  location.reload();
}

async function checkLogin() {
  try {
    const res = await fetch('/api/me');
    if (res.ok) {
      const data = await res.json();
      launchApp(data.email);
    }
  } catch (e) { /* not logged in */ }
}

// ──────────────────────────────────────────────────
// APP INIT
// ──────────────────────────────────────────────────

function launchApp(email) {
  currentUser = email;
  $('loginScreen').classList.add('hidden');
  $('mainApp').classList.remove('hidden');

  // Set user display
  const initial = email[0].toUpperCase();
  $('sbAv').textContent  = initial;
  $('tbAv').textContent  = initial;
  $('sbEmail').textContent = email;
  $('tbLabel').textContent = email.split('@')[0];

  // Set date
  const now = new Date();
  const opts = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  $('pageDate').textContent = now.toLocaleDateString('ar-EG', opts);
  $('routes-date').textContent = now.toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' });

  renderDashboard();
  updatePendingBadge();
}

// ──────────────────────────────────────────────────
// NAVIGATION
// ──────────────────────────────────────────────────

const pageTitles = {
  dashboard: 'لوحة التحكم',
  orders:    'إدارة الطلبات',
  drivers:   'السائقون',
  routes:    'المسارات',
  reports:   'التقارير',
};

function goPage(name, btn) {
  // Hide all pages
  document.querySelectorAll('.pv').forEach(p => p.classList.add('hidden'));
  $('pv-' + name).classList.remove('hidden');

  // Update nav active state
  if (btn) {
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    btn.classList.add('active');
  } else {
    document.querySelectorAll('.nav-item').forEach(i => {
      i.classList.toggle('active', i.textContent.trim().startsWith(pageTitles[name][0]) || i.getAttribute('onclick')?.includes("'" + name + "'"));
    });
  }

  $('pageTitle').textContent = pageTitles[name] || name;

  // Render page content
  if (name === 'dashboard') renderDashboard();
  if (name === 'orders')    renderOrders();
  if (name === 'drivers')   renderDrivers();
  if (name === 'routes')    renderRoutes();
  if (name === 'reports')   renderReports();

  // Close sidebar on mobile
  if (window.innerWidth <= 800) $('sidebar').classList.remove('open');
}

function toggleSidebar() {
  $('sidebar').classList.toggle('open');
}

// ──────────────────────────────────────────────────
// DASHBOARD
// ──────────────────────────────────────────────────

function renderDashboard() {
  const total     = orders.length;
  const delivered = orders.filter(o => o.status === 'delivered').length;
  const transit   = orders.filter(o => o.status === 'in_transit').length;
  const pending   = orders.filter(o => o.status === 'pending').length;

  $('sc-total').textContent     = total;
  $('sc-delivered').textContent = delivered;
  $('sc-transit').textContent   = transit;
  $('sc-pending').textContent   = pending;

  // Recent orders (last 5)
  const recent = [...orders].reverse().slice(0, 5);
  $('db-orders').innerHTML = recent.map(o => `
    <tr>
      <td><span style="font-size:12px;color:var(--muted)">${o.tracking}</span></td>
      <td>${o.customer}</td>
      <td>${getDriverName(o.driver)}</td>
      <td>${statusBadge(o.status)}</td>
    </tr>
  `).join('');

  // Driver status list
  $('db-drivers').innerHTML = drivers.map(d => `
    <div class="db-drv-row">
      <div class="db-drv-info">
        <div class="db-av">${d.name[0]}</div>
        <div>
          <div class="db-drv-name">${d.name}</div>
          <div class="db-drv-area">${d.area}</div>
        </div>
      </div>
      ${statusBadge(d.status, 'driver')}
    </div>
  `).join('');
}

// ──────────────────────────────────────────────────
// ORDERS
// ──────────────────────────────────────────────────

function renderOrders(list) {
  const data = list || getFilteredOrders();
  $('ord-tbody').innerHTML = data.length === 0
    ? '<tr><td colspan="7" style="text-align:center;padding:30px;color:var(--muted)">لا توجد طلبات</td></tr>'
    : data.map(o => `
      <tr>
        <td><span style="font-weight:700;color:var(--blue)">${o.tracking}</span></td>
        <td>${o.customer}</td>
        <td style="font-size:13px;max-width:180px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${o.address}</td>
        <td>${getDriverName(o.driver)}</td>
        <td>${statusBadge(o.status)}</td>
        <td style="color:var(--muted);font-size:13px">${o.time}</td>
        <td>
          <button class="act-btn act-edit" onclick="editOrder(${o.id})">تعديل</button>
          <button class="act-btn act-delete" onclick="confirmDelete('order',${o.id})">حذف</button>
        </td>
      </tr>
    `).join('');

  updatePendingBadge();
}

function getFilteredOrders() {
  return orders.filter(o => {
    const q  = activeFilter.query.toLowerCase();
    const st = activeFilter.status;
    const matchQ  = !q || o.customer.toLowerCase().includes(q) || o.tracking.toLowerCase().includes(q) || o.address.toLowerCase().includes(q);
    const matchSt = !st || o.status === st;
    return matchQ && matchSt;
  });
}

function filterOrders(q) {
  activeFilter.query = q;
  renderOrders();
}

function filterByStatus(s) {
  activeFilter.status = s;
  renderOrders();
}

function openOrderModal(order) {
  // Populate driver dropdown
  $('ord-driver-sel').innerHTML = drivers.map(d =>
    `<option value="${d.id}">${d.name} — ${d.area}</option>`
  ).join('');

  if (order) {
    $('modal-order-h').textContent = 'تعديل الطلب';
    $('ord-edit-id').value         = order.id;
    $('ord-customer').value        = order.customer;
    $('ord-tracking').value        = order.tracking;
    $('ord-address').value         = order.address;
    $('ord-driver-sel').value      = order.driver;
    $('ord-status-sel').value      = order.status;
    $('ord-notes').value           = order.notes;
  } else {
    $('modal-order-h').textContent = 'طلب جديد';
    $('ord-edit-id').value         = '';
    $('ord-customer').value        = '';
    $('ord-tracking').value        = 'ZZ-' + (10240 + nextOrderId);
    $('ord-address').value         = '';
    $('ord-notes').value           = '';
    $('ord-status-sel').value      = 'pending';
  }
  openModal('modal-order');
}

function editOrder(id) {
  const order = orders.find(o => o.id === id);
  if (order) openOrderModal(order);
}

function saveOrder() {
  const customer = $('ord-customer').value.trim();
  const address  = $('ord-address').value.trim();
  if (!customer || !address) { toast('يرجى ملء الحقول المطلوبة *', 'error'); return; }

  const editId = $('ord-edit-id').value;
  const data = {
    customer,
    tracking: $('ord-tracking').value.trim() || 'ZZ-' + (10240 + nextOrderId),
    address,
    driver:   parseInt($('ord-driver-sel').value),
    status:   $('ord-status-sel').value,
    notes:    $('ord-notes').value.trim(),
    time:     new Date().toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' }),
  };

  if (editId) {
    const idx = orders.findIndex(o => o.id === parseInt(editId));
    if (idx !== -1) orders[idx] = { ...orders[idx], ...data };
    toast('تم تحديث الطلب بنجاح', 'success');
  } else {
    orders.push({ id: nextOrderId++, ...data });
    toast('تم إضافة الطلب بنجاح', 'success');
  }

  closeModal('modal-order');
  renderOrders();
  updatePendingBadge();
}

function deleteOrder(id) {
  orders = orders.filter(o => o.id !== id);
  renderOrders();
  toast('تم حذف الطلب', 'success');
}

// ──────────────────────────────────────────────────
// DRIVERS
// ──────────────────────────────────────────────────

function renderDrivers(list) {
  const data = list || drivers;
  $('drv-grid').innerHTML = data.length === 0
    ? '<p style="color:var(--muted);padding:20px">لا يوجد سائقون</p>'
    : data.map(d => {
        const dOrders    = orders.filter(o => o.driver === d.id);
        const dDelivered = dOrders.filter(o => o.status === 'delivered').length;
        const rate       = dOrders.length ? Math.round(dDelivered / dOrders.length * 100) : 0;
        return `
          <div class="drv-card">
            <div class="drv-top">
              <div class="drv-av">${d.name[0]}</div>
              <div>
                <div class="drv-name">${d.name}</div>
                <div class="drv-phone">${d.phone}</div>
              </div>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center">
              <span style="font-size:13px;font-weight:700;color:var(--muted)">${d.area}</span>
              ${statusBadge(d.status, 'driver')}
            </div>
            <div class="drv-stats">
              <div class="drv-stat">
                <div class="drv-stat-n">${dOrders.length}</div>
                <div class="drv-stat-l">طلبات اليوم</div>
              </div>
              <div class="drv-stat">
                <div class="drv-stat-n">${rate}%</div>
                <div class="drv-stat-l">معدل التسليم</div>
              </div>
            </div>
            <div class="drv-actions">
              <button class="act-btn act-edit" onclick="editDriver(${d.id})">تعديل</button>
              <button class="act-btn act-delete" onclick="confirmDelete('driver',${d.id})">حذف</button>
            </div>
          </div>
        `;
      }).join('');
}

function filterDrivers(q) {
  const ql = q.toLowerCase();
  renderDrivers(ql ? drivers.filter(d =>
    d.name.toLowerCase().includes(ql) || d.area.toLowerCase().includes(ql)
  ) : undefined);
}

function openDriverModal() {
  $('drv-name').value       = '';
  $('drv-phone').value      = '';
  $('drv-area').value       = '';
  $('drv-status-sel').value = 'available';
  openModal('modal-driver');
}

function editDriver(id) {
  const d = drivers.find(x => x.id === id);
  if (!d) return;
  $('drv-name').value       = d.name;
  $('drv-phone').value      = d.phone;
  $('drv-area').value       = d.area;
  $('drv-status-sel').value = d.status;
  $('drv-name').dataset.editId = id;
  openModal('modal-driver');
}

function saveDriver() {
  const name = $('drv-name').value.trim();
  if (!name) { toast('يرجى إدخال اسم السائق', 'error'); return; }

  const editId = $('drv-name').dataset.editId;
  const data = {
    name,
    phone:  $('drv-phone').value.trim() || '—',
    area:   $('drv-area').value.trim()  || '—',
    status: $('drv-status-sel').value,
  };

  if (editId) {
    const idx = drivers.findIndex(d => d.id === parseInt(editId));
    if (idx !== -1) drivers[idx] = { ...drivers[idx], ...data };
    delete $('drv-name').dataset.editId;
    toast('تم تحديث بيانات السائق', 'success');
  } else {
    drivers.push({ id: nextDriverId++, orders: 0, delivered: 0, ...data });
    toast('تم إضافة السائق بنجاح', 'success');
  }

  closeModal('modal-driver');
  renderDrivers();
}

function deleteDriver(id) {
  drivers = drivers.filter(d => d.id !== id);
  renderDrivers();
  toast('تم حذف السائق', 'success');
}

// ──────────────────────────────────────────────────
// ROUTES
// ──────────────────────────────────────────────────

function renderRoutes() {
  const rows = drivers.map(d => {
    const dOrders    = orders.filter(o => o.driver === d.id);
    const done       = dOrders.filter(o => o.status === 'delivered' || o.status === 'failed').length;
    const total      = dOrders.length;
    const pct        = total ? Math.round(done / total * 100) : 0;
    const routeStatus = d.status === 'off' ? 'off' :
                        pct === 100       ? 'delivered' :
                        d.status === 'on_route' ? 'in_transit' : 'pending';

    return `
      <tr>
        <td><strong>${d.area}</strong></td>
        <td>${d.name}</td>
        <td>${total}</td>
        <td>${done}</td>
        <td>
          <div class="prog-wrap">
            <div class="prog-bar" style="width:${pct}%"></div>
          </div>
          <span style="font-size:12px;color:var(--muted);margin-top:3px;display:block">${pct}%</span>
        </td>
        <td>${statusBadge(routeStatus)}</td>
      </tr>
    `;
  });
  $('rts-tbody').innerHTML = rows.join('');
}

// ──────────────────────────────────────────────────
// REPORTS
// ──────────────────────────────────────────────────

function renderReports() {
  const total      = orders.length;
  const delivered  = orders.filter(o => o.status === 'delivered').length;
  const failed     = orders.filter(o => o.status === 'failed').length;
  const activeD    = drivers.filter(d => d.status !== 'off').length;
  const rate       = total ? Math.round(delivered / total * 100) : 0;

  $('rp-total').textContent   = total;
  $('rp-rate').textContent    = rate + '%';
  $('rp-drivers').textContent = activeD;
  $('rp-failed').textContent  = failed;

  // Per-driver stats
  $('rp-drv').innerHTML = drivers.map(d => {
    const dTotal = orders.filter(o => o.driver === d.id).length;
    const dDone  = orders.filter(o => o.driver === d.id && o.status === 'delivered').length;
    const dRate  = dTotal ? Math.round(dDone / dTotal * 100) : 0;
    return `<tr>
      <td>${d.name}</td>
      <td>${dTotal}</td>
      <td>${dDone}</td>
      <td><span class="badge ${dRate >= 80 ? 'b-delivered' : dRate >= 50 ? 'b-pending' : 'b-failed'}">${dRate}%</span></td>
    </tr>`;
  }).join('');

  // Per-area stats
  const areas = {};
  orders.forEach(o => {
    const driver = drivers.find(d => d.id === o.driver);
    const area   = driver ? driver.area : 'غير محدد';
    if (!areas[area]) areas[area] = { total: 0, done: 0 };
    areas[area].total++;
    if (o.status === 'delivered') areas[area].done++;
  });

  $('rp-area').innerHTML = Object.entries(areas).map(([area, s]) => `
    <tr>
      <td>${area}</td>
      <td>${s.total}</td>
      <td>${s.done}</td>
    </tr>
  `).join('');
}

// ──────────────────────────────────────────────────
// CONFIRM DELETE
// ──────────────────────────────────────────────────

function confirmDelete(type, id) {
  const item = type === 'order'
    ? orders.find(o => o.id === id)
    : drivers.find(d => d.id === id);

  if (!item) return;
  $('confirm-msg').textContent = `هل تريد حذف "${type === 'order' ? item.customer + ' — ' + item.tracking : item.name}" نهائياً؟`;

  const btn = $('confirm-ok-btn');
  btn.onclick = () => {
    closeModal('modal-confirm');
    if (type === 'order') deleteOrder(id);
    else deleteDriver(id);
  };
  openModal('modal-confirm');
}

// ──────────────────────────────────────────────────
// HELPERS
// ──────────────────────────────────────────────────

function getDriverName(id) {
  const d = drivers.find(x => x.id === id);
  return d ? d.name : '—';
}

function statusBadge(status, type) {
  const labels = {
    delivered:  'تم التسليم',
    in_transit: 'في الطريق',
    pending:    'قيد الانتظار',
    failed:     'فشل التسليم',
    available:  'متاح',
    on_route:   'في المسار',
    off:        'غير متاح',
  };
  return `<span class="badge b-${status}">${labels[status] || status}</span>`;
}

function updatePendingBadge() {
  const count = orders.filter(o => o.status === 'pending').length;
  const badge = $('nav-pending-badge');
  if (count > 0) {
    badge.textContent = count;
    badge.classList.remove('hidden');
  } else {
    badge.classList.add('hidden');
  }
}

function openModal(id) {
  $(id).classList.remove('hidden');
}

function closeModal(id) {
  $(id).classList.add('hidden');
}

function toast(msg, type) {
  const el = $('toast');
  el.textContent = msg;
  el.className   = 'toast ' + (type || '');
  setTimeout(() => el.classList.add('hidden'), 3000);
}

function $(id) {
  return document.getElementById(id);
}

// ──────────────────────────────────────────────────
// BOOT
// ──────────────────────────────────────────────────
checkLogin();
