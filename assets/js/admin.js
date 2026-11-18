document.addEventListener('DOMContentLoaded', async function () {
  const loginView = document.getElementById('login-view');
  const appView = document.getElementById('app-view');
  const loginForm = document.getElementById('login-form');
  const loginError = document.getElementById('login-error');
  const pageTitle = document.getElementById('page-title');
  const navItems = document.querySelectorAll('.nav-item');
  const sections = document.querySelectorAll('.content-section');
  const dashboardKpis = document.getElementById('dashboard-kpis');
  const miniGrid = document.getElementById('mini-grid');
  const activityFeed = document.getElementById('activity-feed');
  const computerGrid = document.getElementById('computer-grid');
  const recordsTableBody = document.getElementById('records-table-body');
  const staffTableBody = document.getElementById('staff-table-body');
  const studentsTableBody = document.getElementById('students-table-body');
  const reportRecordsBody = document.getElementById('report-records-body');
  const reportSummary = document.getElementById('report-summary');
  const monthlyReportSummary = document.getElementById('monthly-report-summary');
  const reportMonthInput = document.getElementById('report-month');
  const telemetryBadgeText = document.getElementById('telemetry-badge-text');

  // Modals & Forms
  const computerModal = document.getElementById('computer-modal');
  const modalBody = document.getElementById('modal-body');
  const modalActions = document.getElementById('modal-actions');
  const computerFormPanel = document.getElementById('computer-form-panel');
  const addComputerForm = document.getElementById('add-computer-form');
  const computerFormError = document.getElementById('computer-form-error');
  const addComputerBtn = document.getElementById('add-computer-btn');
  const cancelComputerFormBtn = document.getElementById('cancel-computer-form-btn');

  // Staff Modal elements
  const staffModal = document.getElementById('staff-modal');
  const staffModalTitle = document.getElementById('staff-modal-title');
  const staffForm = document.getElementById('staff-form');
  const staffFormError = document.getElementById('staff-form-error');
  const staffFormPk = document.getElementById('staff-form-pk');
  const staffFormId = document.getElementById('staff-form-id');
  const staffFormName = document.getElementById('staff-form-name');
  const staffFormDept = document.getElementById('staff-form-dept');
  const staffFormDesignation = document.getElementById('staff-form-designation');
  const staffFormEmail = document.getElementById('staff-form-email');
  const staffFormPhone = document.getElementById('staff-form-phone');
  const staffFormLab = document.getElementById('staff-form-lab');
  const openAddStaffBtn = document.getElementById('open-add-staff-btn');

  // Delete Staff Modal elements
  const deleteStaffModal = document.getElementById('delete-staff-modal');
  const deleteStaffName = document.getElementById('delete-staff-name');
  const confirmDeleteStaffBtn = document.getElementById('confirm-delete-staff-btn');
  let pendingDeleteStaffId = null;

  // Student Modal elements
  const studentModal = document.getElementById('student-modal');
  const studentModalTitle = document.getElementById('student-modal-title');
  const studentForm = document.getElementById('student-form');
  const studentFormError = document.getElementById('student-form-error');
  const studentFormId = document.getElementById('student-form-id');
  const studentFormName = document.getElementById('student-form-name');
  const studentFormDob = document.getElementById('student-form-dob');
  const studentFormReg = document.getElementById('student-form-reg');
  const studentFormDept = document.getElementById('student-form-dept');
  const studentFormYear = document.getElementById('student-form-year');
  const openAddStudentBtn = document.getElementById('open-add-student-btn');
  const studentExcelInput = document.getElementById('student-excel-input');
  const studentImportStatus = document.getElementById('student-import-status');

  // Clear All Records Button
  const clearAllRecordsBtn = document.getElementById('clear-all-records-btn');

  const ADMIN_SESSION_KEY = 'smartlab-admin-auth';
  let activeSection = 'dashboard';
  let autoPollTimer = null;

  function isAdminLoggedIn() {
    return sessionStorage.getItem(ADMIN_SESSION_KEY) === 'true';
  }

  function setAdminSession(value) {
    if (value) {
      sessionStorage.setItem(ADMIN_SESSION_KEY, 'true');
      return;
    }
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
  }

  function showAdminLogin() {
    appView.classList.add('hidden');
    loginView.classList.remove('hidden');
    loginForm.reset();
    loginError.classList.add('hidden');
    loginError.textContent = '';
    if (autoPollTimer) {
      clearInterval(autoPollTimer);
      autoPollTimer = null;
    }
  }

  function showAdminDashboard() {
    loginView.classList.add('hidden');
    appView.classList.remove('hidden');
    startAutoPolling();
  }

  function setPage(section) {
    activeSection = section;
    navItems.forEach((item) => item.classList.toggle('active', item.dataset.section === section));
    sections.forEach((element) => element.classList.toggle('active', element.id === `${section}-section`));
    const labels = {
      dashboard: 'Overview & Telemetry',
      computers: 'Workstation Management',
      records: 'Lab Usage Records',
      students: 'Student Logins & Registry',
      staff: 'Staff Details & Management',
      reports: 'Usage Reports & Logs',
      analytics: 'Analytics & Insights',
      settings: 'System Settings'
    };
    pageTitle.textContent = labels[section] || 'Overview';
  }

  function getStatusLabel(status) {
    if (status === 'MAINTENANCE') return 'Under Maintenance';
    if (status === 'IN_USE') return 'In Use';
    if (status === 'OFFLINE') return 'Offline';
    return 'Available';
  }

  function formatStatusClass(status) {
    return (status || 'AVAILABLE').toLowerCase().replace('_', '-');
  }

  /* RENDER DASHBOARD & TELEMETRY */
  async function renderDashboard(forceFresh = false) {
    const summary = await SmartLabData.getComputerStatusSummary(forceFresh);
    const state = await SmartLabData.loadState(forceFresh);

    // Update Topbar Telemetry Badge
    if (telemetryBadgeText) {
      telemetryBadgeText.innerHTML = `<strong>Live Telemetry:</strong> ${summary.available} Available · ${summary.inUse} In Use · ${summary.offline + (summary.maintenance || 0)} Offline`;
    }

    // KPIs
    const stats = [
      { label: 'Total Workstations', value: summary.total, sub: 'Hardware deployed', tone: 'primary', icon: '🖥️' },
      { label: 'Available Workstations', value: summary.available, sub: `${summary.availablePct}% ready for students`, tone: 'success', icon: '🟢' },
      { label: 'Occupied / In Use', value: summary.inUse, sub: `${summary.occupancyPct}% current occupancy`, tone: 'info', icon: '⚡' },
      { label: 'Staff Members', value: summary.totalStaff || (state.staff || []).length, sub: 'Active lab faculty & staff', tone: 'warning', icon: '👨‍🏫' }
    ];

    dashboardKpis.innerHTML = stats.map((stat) => `
      <div class="kpi-card ${stat.tone}">
        <div class="kpi-head">
          <p class="label">${stat.label}</p>
          <span class="kpi-icon">${stat.icon}</span>
        </div>
        <div class="value">${stat.value}</div>
        <p class="kpi-sub">${stat.sub}</p>
      </div>
    `).join('');

    // Meter Bar & Legend
    const availFill = document.getElementById('meter-available-fill');
    const inuseFill = document.getElementById('meter-inuse-fill');
    const offlineFill = document.getElementById('meter-offline-fill');
    if (availFill && inuseFill && offlineFill) {
      availFill.style.width = `${summary.availablePct}%`;
      inuseFill.style.width = `${summary.occupancyPct}%`;
      const offPct = Math.max(0, 100 - summary.availablePct - summary.occupancyPct).toFixed(1);
      offlineFill.style.width = `${offPct}%`;

      document.getElementById('legend-avail-count').textContent = summary.available;
      document.getElementById('legend-avail-pct').textContent = `${summary.availablePct}%`;
      document.getElementById('legend-inuse-count').textContent = summary.inUse;
      document.getElementById('legend-inuse-pct').textContent = `${summary.occupancyPct}%`;
      document.getElementById('legend-offline-count').textContent = summary.offline + (summary.maintenance || 0);
      document.getElementById('legend-offline-pct').textContent = `${offPct}%`;
    }

    // Mini Matrix Grid (Snapshot of 20 PCs)
    if (miniGrid) {
      miniGrid.innerHTML = (state.computers || []).slice(0, 25).map((pc) => {
        const cls = formatStatusClass(pc.status);
        const pcNum = pc.id.replace('LAB-PC-', '');
        const tooltip = `${pc.id}: ${pc.status}${pc.studentName ? ' by ' + pc.studentName : ''}`;
        return `
          <div class="mini-node ${cls}" title="${tooltip}" data-computer-id="${pc.id}">
            <span class="status-dot ${cls}" aria-hidden="true"></span>
            ${pcNum}
          </div>
        `;
      }).join('');

      miniGrid.querySelectorAll('.mini-node').forEach((node) => {
        node.addEventListener('click', () => openComputerModal(node.dataset.computerId));
      });
    }

    // Recent Activity Feed
    if (activityFeed) {
      const records = (state.records || []).slice(0, 5);
      if (!records.length) {
        activityFeed.innerHTML = '<p class="text-muted" style="padding: 12px;">No usage activity logged yet.</p>';
      } else {
        activityFeed.innerHTML = records.map((rec) => `
          <div class="activity-item">
            <div class="act-badge ${rec.status === 'IN_USE' ? 'live' : 'done'}">
              ${rec.status === 'IN_USE' ? '⚡' : '✓'}
            </div>
            <div class="act-info">
              <strong>${SmartLabUtils.escapeHtml(rec.studentName)} (${SmartLabUtils.escapeHtml(rec.department)})</strong>
              <p>Booked <code>${rec.computerId}</code> · ${rec.startTime} - ${rec.endTime} (${rec.durationHours}h)</p>
            </div>
            <span class="act-time">${rec.status === 'IN_USE' ? '<span class="pulse-tag">Active</span>' : 'Completed'}</span>
          </div>
        `).join('');
      }

      const actTime = document.getElementById('activity-update-time');
      if (actTime) {
        actTime.textContent = `Updated: ${new Date().toLocaleTimeString()}`;
      }
    }
  }

  /* RENDER COMPUTERS GRID */
  async function renderComputerGrid() {
    const computerSearch = document.getElementById('computer-search');
    const computerFilter = document.getElementById('computer-filter');
    const searchTerm = (computerSearch ? computerSearch.value : '').trim().toLowerCase();
    const filterTerm = computerFilter ? computerFilter.value : 'all';
    const state = await SmartLabData.loadState();

    const computers = (state.computers || []).filter((pc) => {
      const matchesSearch = !searchTerm ||
        pc.id.toLowerCase().includes(searchTerm) ||
        (pc.studentName || '').toLowerCase().includes(searchTerm) ||
        (pc.department || '').toLowerCase().includes(searchTerm);
      const matchesFilter = filterTerm === 'all' || pc.status === filterTerm;
      return matchesSearch && matchesFilter;
    });

    if (!computers.length) {
      computerGrid.innerHTML = '<div class="panel-box" style="grid-column: 1 / -1;"><p>No workstations match your criteria.</p></div>';
      return;
    }

    computerGrid.innerHTML = computers.map((pc) => {
      const isOccupied = pc.status === 'IN_USE';
      const statusCls = formatStatusClass(pc.status);
      let metaHtml = `Last active: ${SmartLabUtils.formatDate(pc.lastSeen?.slice(0, 10))}`;
      if (isOccupied && pc.currentBooking) {
        const nowMin = new Date().getHours() * 60 + new Date().getMinutes();
        const endMin = SmartLabUtils.parseTimeToMinutes(pc.currentBooking.end);
        const remMin = endMin - nowMin;
        if (remMin > 0) {
          metaHtml = `Slot: ${pc.currentBooking.start} - ${pc.currentBooking.end} · <span class="time-remaining-tag active" title="Time remaining in session">⏱️ ${remMin}m left</span>`;
        } else {
          metaHtml = `Slot: ${pc.currentBooking.start} - ${pc.currentBooking.end} · <span class="time-remaining-tag expired" title="Session time over - auto-releasing">⏱️ Time Expired</span>`;
        }
      }

      return `
        <div class="computer-card status-${statusCls}" data-computer-id="${pc.id}">
          <div class="comp-header">
            <span class="comp-name">${pc.id}</span>
            <span class="status-tag ${statusCls}">${getStatusLabel(pc.status)}</span>
          </div>
          <div class="comp-body">
            <p class="comp-user">
              ${isOccupied ? `<strong>👤 ${SmartLabUtils.escapeHtml(pc.studentName)}</strong> <span class="comp-dept">(${SmartLabUtils.escapeHtml(pc.department)})</span>` : pc.status === 'MAINTENANCE' ? '🔒 Maintenance Mode' : '✨ Available for Session'}
            </p>
            <p class="comp-meta">
              ${metaHtml}
            </p>
          </div>
          <div class="comp-actions">
            ${isOccupied ? `<button type="button" class="btn btn-sm btn-outline-danger release-btn" data-pc="${pc.id}">Release PC</button>` : ''}
            <button type="button" class="btn btn-sm btn-ghost view-comp-btn" data-pc="${pc.id}">Manage</button>
          </div>
        </div>
      `;
    }).join('');

    // Attach release quick actions
    computerGrid.querySelectorAll('.release-btn').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const pcId = btn.dataset.pc;
        btn.disabled = true;
        btn.textContent = 'Releasing...';
        await SmartLabData.releaseComputer(pcId);
        SmartLabUtils.showToast(`Workstation ${pcId} released and set to Available.`, 'success');
        await renderAll(true);
      });
    });

    computerGrid.querySelectorAll('.computer-card, .view-comp-btn').forEach((elem) => {
      elem.addEventListener('click', () => {
        const pcId = elem.dataset.pc || elem.dataset.computerId;
        if (pcId) openComputerModal(pcId);
      });
    });
  }

  /* RENDER USAGE RECORDS */
  async function renderRecords() {
    const recordSearch = document.getElementById('record-search');
    const recordStatusFilter = document.getElementById('record-status-filter');
    const term = (recordSearch ? recordSearch.value : '').trim().toLowerCase();
    const filter = recordStatusFilter ? recordStatusFilter.value : 'all';
    const state = await SmartLabData.loadState();

    const records = (state.records || []).filter((record) => {
      const matchesText = !term ||
        record.studentName.toLowerCase().includes(term) ||
        (record.registerNumber || '').toLowerCase().includes(term) ||
        record.computerId.toLowerCase().includes(term) ||
        (record.department || '').toLowerCase().includes(term);
      const matchesStatus = filter === 'all' || record.status === filter;
      return matchesText && matchesStatus;
    });

    recordsTableBody.innerHTML = records.length
      ? records.map((record) => `
        <tr data-record-id="${record.id}">
          <td><strong>${SmartLabUtils.escapeHtml(record.studentName)}</strong></td>
          <td><code>${SmartLabUtils.escapeHtml(record.registerNumber)}</code></td>
          <td><span class="badge badge-pc">${SmartLabUtils.escapeHtml(record.computerId)}</span></td>
          <td><span class="dept-badge">${SmartLabUtils.escapeHtml(record.department)}</span></td>
          <td>${SmartLabUtils.formatDate(record.bookedDate)}</td>
          <td>${record.startTime} - ${record.endTime}</td>
          <td>${record.durationHours || SmartLabUtils.formatDuration(record.startTime, record.endTime)}</td>
          <td><span class="status-tag ${record.status === 'IN_USE' ? 'in-use' : 'available'}">${record.status === 'IN_USE' ? 'Active' : 'Completed'}</span></td>
          <td style="text-align: right;">
            <div class="row-actions" style="display: flex; gap: 6px; justify-content: flex-end;">
              <button type="button" class="btn btn-icon edit-record-btn" data-id="${record.id}" title="Alter Record Details">✏️ Alter</button>
              <button type="button" class="btn btn-icon restart-record-btn" data-id="${record.id}" data-student="${SmartLabUtils.escapeHtml(record.studentName)}" data-pc="${record.computerId}" title="Restart Session Now">🔄 Restart</button>
              <button type="button" class="btn btn-icon btn-danger delete-record-btn" data-id="${record.id}" data-student="${SmartLabUtils.escapeHtml(record.studentName)}" data-pc="${record.computerId}" title="Delete this Usage Record">🗑️ Delete</button>
            </div>
          </td>
        </tr>
      `).join('')
      : '<tr><td colspan="9" class="text-center" style="padding: 24px; color: var(--text-muted);">No records found matching criteria.</td></tr>';

    // Attach Edit / Alter Handlers
    recordsTableBody.querySelectorAll('.edit-record-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const recId = btn.dataset.id;
        const rec = (records || []).find((r) => r.id === recId);
        if (rec) openRecordEditModal(rec);
      });
    });

    // Attach Restart Handlers
    recordsTableBody.querySelectorAll('.restart-record-btn').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const recId = btn.dataset.id;
        const student = btn.dataset.student;
        const pc = btn.dataset.pc;
        btn.disabled = true;
        btn.textContent = 'Restarting...';
        try {
          await SmartLabData.restartUsageRecord(recId);
          SmartLabUtils.showToast(`Session restarted for ${student} on ${pc}. Workstation marked IN_USE.`, 'success');
          await renderAll(true);
        } catch (err) {
          SmartLabUtils.showToast('Failed to restart session.', 'error');
        }
      });
    });

    // Attach Individual Delete Handlers
    recordsTableBody.querySelectorAll('.delete-record-btn').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const recId = btn.dataset.id;
        const student = btn.dataset.student;
        const pc = btn.dataset.pc;
        if (!confirm(`Are you sure you want to delete the lab usage record for ${student} on workstation ${pc}?`)) {
          return;
        }
        btn.disabled = true;
        btn.textContent = 'Deleting...';
        try {
          await SmartLabData.deleteUsageRecord(recId);
          SmartLabUtils.showToast(`Usage record for ${student} on ${pc} deleted.`, 'success');
          await renderAll(true);
        } catch (err) {
          SmartLabUtils.showToast('Failed to delete usage record.', 'error');
          btn.disabled = false;
          btn.textContent = '🗑️ Delete';
        }
      });
    });
  }

  /* RENDER STAFF MANAGEMENT (REPLACING STUDENTS PER REQUIREMENT 2) */
  async function renderStaff() {
    const staffSearch = document.getElementById('staff-search');
    const staffDeptFilter = document.getElementById('staff-dept-filter');
    const term = (staffSearch ? staffSearch.value : '').trim().toLowerCase();
    const dept = staffDeptFilter ? staffDeptFilter.value : 'all';

    const staffList = await SmartLabData.getStaff();

    const filtered = (staffList || []).filter((s) => {
      const matchesText = !term ||
        (s.name || '').toLowerCase().includes(term) ||
        (s.staffId || '').toLowerCase().includes(term) ||
        (s.designation || '').toLowerCase().includes(term) ||
        (s.email || '').toLowerCase().includes(term);
      const matchesDept = dept === 'all' || s.department === dept;
      return matchesText && matchesDept;
    });

    if (!filtered.length) {
      staffTableBody.innerHTML = `
        <tr>
          <td colspan="7" class="text-center" style="padding: 28px; color: var(--text-muted);">
            No staff members found. Click "➕ Add Staff Member" to register faculty or technicians.
          </td>
        </tr>
      `;
      return;
    }

    staffTableBody.innerHTML = filtered.map((s) => `
      <tr data-staff-id="${s.id}">
        <td><strong class="staff-code">${SmartLabUtils.escapeHtml(s.staffId || 'STF-???')}</strong></td>
        <td>
          <div class="staff-person">
            <span class="staff-avatar">${(s.name || 'S').charAt(0).toUpperCase()}</span>
            <div>
              <strong>${SmartLabUtils.escapeHtml(s.name)}</strong>
            </div>
          </div>
        </td>
        <td><span class="dept-badge ${s.department}">${SmartLabUtils.escapeHtml(s.department)}</span></td>
        <td><span class="designation-text">${SmartLabUtils.escapeHtml(s.designation)}</span></td>
        <td>
          <div class="contact-details">
            ${s.email ? `<span class="contact-email">✉️ ${SmartLabUtils.escapeHtml(s.email)}</span>` : ''}
            ${s.phone ? `<span class="contact-phone">📞 ${SmartLabUtils.escapeHtml(s.phone)}</span>` : '<span class="text-muted">—</span>'}
          </div>
        </td>
        <td><span class="lab-badge">📍 ${SmartLabUtils.escapeHtml(s.assignedLab || 'Innovation Lab 01')}</span></td>
        <td style="text-align: right;">
          <div class="row-actions">
            <button type="button" class="btn btn-icon edit-staff-btn" data-id="${s.id}" title="Edit Staff Details">✏️</button>
            <button type="button" class="btn btn-icon btn-danger-icon delete-staff-btn" data-id="${s.id}" data-name="${SmartLabUtils.escapeHtml(s.name)}" title="Delete Staff Member">🗑️</button>
          </div>
        </td>
      </tr>
    `).join('');

    // Attach Edit Handlers
    staffTableBody.querySelectorAll('.edit-staff-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const staffId = btn.dataset.id;
        const member = (staffList || []).find((s) => Number(s.id) === Number(staffId));
        if (member) openStaffModal('edit', member);
      });
    });

    // Attach Delete Handlers
    staffTableBody.querySelectorAll('.delete-staff-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        pendingDeleteStaffId = btn.dataset.id;
        deleteStaffName.textContent = `"${btn.dataset.name}"`;
        deleteStaffModal.classList.remove('hidden');
      });
    });
  }

  /* RENDER STUDENTS & STUDENT LOGINS */
  async function renderStudents() {
    const studentSearch = document.getElementById('student-search');
    const studentDeptFilter = document.getElementById('student-dept-filter');
    const studentYearFilter = document.getElementById('student-year-filter');
    const term = (studentSearch ? studentSearch.value : '').trim().toLowerCase();
    const dept = studentDeptFilter ? studentDeptFilter.value : 'all';
    const year = studentYearFilter ? studentYearFilter.value : 'all';

    const state = await SmartLabData.loadState();
    const studentList = state.students || [];

    const filtered = (studentList || []).filter((s) => {
      const matchesText = !term ||
        (s.name || '').toLowerCase().includes(term) ||
        (s.dob || '').toLowerCase().includes(term) ||
        (s.registerNumber || '').toLowerCase().includes(term) ||
        (s.department || '').toLowerCase().includes(term);
      const matchesDept = dept === 'all' || s.department === dept;
      const matchesYear = year === 'all' || s.year === year;
      return matchesText && matchesDept && matchesYear;
    });

    if (!studentsTableBody) return;

    if (!filtered.length) {
      studentsTableBody.innerHTML = `
        <tr>
          <td colspan="6" class="text-center" style="padding: 28px; color: var(--text-muted);">
            No student login credentials found matching filter criteria. Click "➕ Add Student Login" to enroll a student.
          </td>
        </tr>
      `;
      return;
    }

    studentsTableBody.innerHTML = filtered.map((s) => `
      <tr data-student-id="${s.id}">
        <td>
          <div style="display: flex; align-items: center; gap: 10px;">
            <span style="width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, #4f46e5, #3730a3); color: #fff; display: grid; place-items: center; font-weight: 800; font-size: 13px;">${(s.name || 'S').charAt(0).toUpperCase()}</span>
            <div>
              <strong style="color: #0f172a; font-size: 0.95rem;">${SmartLabUtils.escapeHtml(s.name)}</strong>
              <div style="font-size: 0.75rem; color: var(--text-muted);">Student ID: #${s.id}</div>
            </div>
          </div>
        </td>
        <td>
          <code style="background: rgba(99, 102, 241, 0.12); color: #4338ca; padding: 4px 10px; border-radius: 8px; font-weight: 800; font-size: 0.9rem; border: 1px solid rgba(99, 102, 241, 0.25);">
            📅 ${s.dob ? SmartLabUtils.escapeHtml(s.dob) : '<span style="color: #ef4444;">Not Set</span>'}
          </code>
        </td>
        <td><code>${SmartLabUtils.escapeHtml(s.registerNumber || '—')}</code></td>
        <td><span class="dept-badge ${s.department}">${SmartLabUtils.escapeHtml(s.department)}</span></td>
        <td><span class="badge" style="background: #f1f5f9; color: #475569; font-weight: 700; padding: 4px 8px; border-radius: 6px;">${SmartLabUtils.escapeHtml(s.year || '—')}</span></td>
        <td style="text-align: right;">
          <div class="row-actions" style="display: flex; gap: 6px; justify-content: flex-end;">
            <button type="button" class="btn btn-icon use-student-login-btn" data-id="${s.id}" data-name="${SmartLabUtils.escapeHtml(s.name)}" data-dob="${SmartLabUtils.escapeHtml(s.dob || '')}" data-reg="${SmartLabUtils.escapeHtml(s.registerNumber || '')}" data-dept="${SmartLabUtils.escapeHtml(s.department || '')}" data-year="${SmartLabUtils.escapeHtml(s.year || '')}" title="Authenticate & Use Login in Student Portal" style="background: rgba(16, 185, 129, 0.12); color: #059669; border: 1px solid rgba(16, 185, 129, 0.3);">
              <span>⚡ Use Login</span>
            </button>
            <button type="button" class="btn btn-icon edit-student-btn" data-id="${s.id}" data-name="${SmartLabUtils.escapeHtml(s.name)}" data-dob="${SmartLabUtils.escapeHtml(s.dob || '')}" data-reg="${SmartLabUtils.escapeHtml(s.registerNumber || '')}" data-dept="${SmartLabUtils.escapeHtml(s.department || '')}" data-year="${SmartLabUtils.escapeHtml(s.year || '')}" title="Edit Student Login">✏️ Edit</button>
            <button type="button" class="btn btn-icon btn-danger delete-student-btn" data-id="${s.id}" data-name="${SmartLabUtils.escapeHtml(s.name)}" title="Delete Student Login">🗑️ Delete</button>
          </div>
        </td>
      </tr>
    `).join('');

    // Attach Use Login Handler
    studentsTableBody.querySelectorAll('.use-student-login-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const studentObj = {
          id: btn.dataset.id,
          name: btn.dataset.name,
          dob: btn.dataset.dob,
          registerNumber: btn.dataset.reg,
          department: btn.dataset.dept,
          year: btn.dataset.year
        };
        sessionStorage.setItem('smartlab_student', JSON.stringify(studentObj));
        SmartLabUtils.showToast(`Logged in as ${studentObj.name}! Opening Student Portal...`, 'success');
        window.open('student.html', '_blank');
      });
    });

    // Attach Edit Student Handler
    studentsTableBody.querySelectorAll('.edit-student-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        studentFormId.value = btn.dataset.id;
        studentFormName.value = btn.dataset.name;
        studentFormDob.value = btn.dataset.dob;
        studentFormReg.value = btn.dataset.reg;
        studentFormDept.value = btn.dataset.dept;
        studentFormYear.value = btn.dataset.year;
        studentModalTitle.textContent = 'Edit Student Login Credentials';
        studentFormError.classList.add('hidden');
        studentModal.classList.remove('hidden');
      });
    });

    // Attach Delete Student Handler
    studentsTableBody.querySelectorAll('.delete-student-btn').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const stuId = btn.dataset.id;
        const stuName = btn.dataset.name;
        if (!confirm(`Are you sure you want to delete student login for ${stuName}?`)) {
          return;
        }
        btn.disabled = true;
        btn.textContent = 'Deleting...';
        try {
          await SmartLabData.deleteStudent(stuId);
          SmartLabUtils.showToast(`Student ${stuName} deleted successfully.`, 'success');
          await renderAll(true);
        } catch (err) {
          SmartLabUtils.showToast('Failed to delete student: ' + (err.message || 'Error'), 'error');
          btn.disabled = false;
          btn.textContent = '🗑️ Delete';
        }
      });
    });
  }

  /* STAFF MODAL OPEN/CLOSE & SUBMIT */
  function openStaffModal(mode = 'add', staffMember = null) {
    staffForm.reset();
    staffFormError.classList.add('hidden');
    staffFormError.textContent = '';

    if (mode === 'edit' && staffMember) {
      staffModalTitle.textContent = 'Edit Staff Member';
      staffFormPk.value = staffMember.id;
      staffFormId.value = staffMember.staffId || '';
      staffFormName.value = staffMember.name || '';
      staffFormDept.value = staffMember.department || 'CSE';
      staffFormDesignation.value = staffMember.designation || '';
      staffFormEmail.value = staffMember.email || '';
      staffFormPhone.value = staffMember.phone || '';
      staffFormLab.value = staffMember.assignedLab || 'Innovation Lab 01';
      document.getElementById('save-staff-btn').textContent = 'Update Staff Member';
    } else {
      staffModalTitle.textContent = 'Add Staff Member';
      staffFormPk.value = '';
      staffFormId.value = `STF-${Math.floor(100 + Math.random() * 900)}`;
      staffFormLab.value = 'Innovation Lab 01';
      document.getElementById('save-staff-btn').textContent = 'Save Staff Member';
    }

    staffModal.classList.remove('hidden');
  }

  if (openAddStaffBtn) {
    openAddStaffBtn.addEventListener('click', () => openStaffModal('add'));
  }

  staffForm.addEventListener('submit', async function (event) {
    event.preventDefault();
    const pk = staffFormPk.value;
    const payload = {
      staffId: staffFormId.value.trim().toUpperCase(),
      name: staffFormName.value.trim(),
      department: staffFormDept.value.trim(),
      designation: staffFormDesignation.value.trim(),
      email: staffFormEmail.value.trim(),
      phone: staffFormPhone.value.trim(),
      assignedLab: staffFormLab.value.trim() || 'Innovation Lab 01'
    };

    if (!payload.staffId || !payload.name || !payload.department || !payload.designation) {
      staffFormError.textContent = 'Please fill out Staff ID, Full Name, Department, and Designation.';
      staffFormError.classList.remove('hidden');
      return;
    }

    const saveBtn = document.getElementById('save-staff-btn');
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';

    try {
      if (pk) {
        await SmartLabData.updateStaff(pk, payload);
        SmartLabUtils.showToast(`Staff member "${payload.name}" updated successfully.`, 'success');
      } else {
        await SmartLabData.addStaff(payload);
        SmartLabUtils.showToast(`Staff member "${payload.name}" registered successfully.`, 'success');
      }
      staffModal.classList.add('hidden');
      await renderStaff();
      await renderDashboard();
    } catch (err) {
      staffFormError.textContent = err.message || 'Failed to save staff member.';
      staffFormError.classList.remove('hidden');
    } finally {
      saveBtn.disabled = false;
    }
  });

  // Confirm delete staff
  if (confirmDeleteStaffBtn) {
    confirmDeleteStaffBtn.addEventListener('click', async () => {
      if (pendingDeleteStaffId) {
        confirmDeleteStaffBtn.disabled = true;
        await SmartLabData.deleteStaff(pendingDeleteStaffId);
        SmartLabUtils.showToast('Staff member deleted successfully.', 'info');
        deleteStaffModal.classList.add('hidden');
        pendingDeleteStaffId = null;
        confirmDeleteStaffBtn.disabled = false;
        await renderStaff();
        await renderDashboard();
      }
    });
  }

  /* RENDER REPORTS & ANALYTICS */
  async function renderReports() {
    const state = await SmartLabData.loadState();
    const summary = (state.records || []).reduce((acc, record) => {
      acc.total += 1;
      acc.hours += SmartLabUtils.timeDifferenceInHours(record.startTime, record.endTime);
      return acc;
    }, { total: 0, hours: 0 });

    reportSummary.innerHTML = `
      <li><span>Total usage entries logged</span><strong>${summary.total}</strong></li>
      <li><span>Total student hours logged</span><strong>${summary.hours.toFixed(1)} hrs</strong></li>
      <li><span>Participating departments</span><strong>${SmartLabUtils.uniqueValues(state.records || [], 'department').length}</strong></li>
      <li><span>Total active workstations</span><strong>${(state.computers || []).length}</strong></li>
      <li><span>Faculty & Lab Staff members</span><strong>${(state.staff || []).length}</strong></li>
    `;

    reportRecordsBody.innerHTML = (state.records || []).length
      ? state.records.map((record) => `
        <tr>
          <td><strong>${SmartLabUtils.escapeHtml(record.studentName)}</strong></td>
          <td><span class="badge badge-pc">${SmartLabUtils.escapeHtml(record.computerId)}</span></td>
          <td><span class="dept-badge">${SmartLabUtils.escapeHtml(record.department)}</span></td>
          <td>${SmartLabUtils.formatDate(record.bookedDate)}</td>
          <td>${record.startTime} - ${record.endTime}</td>
          <td>${record.durationHours || SmartLabUtils.formatDuration(record.startTime, record.endTime)}</td>
        </tr>
      `).join('')
      : '<tr><td colspan="6" class="text-center" style="padding: 24px; color: var(--text-muted);">No reports logged yet.</td></tr>';

    if (!reportMonthInput.value) {
      const current = new Date();
      reportMonthInput.value = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;
    }
    const reportDayInput = document.getElementById('report-day');
    if (reportDayInput && !reportDayInput.value) {
      reportDayInput.value = new Date().toISOString().slice(0, 10);
    }
    await generateDailyReport();
    await generateMonthlyReport();
  }

  async function generateDailyReport() {
    const reportDayInput = document.getElementById('report-day');
    const dailyReportSummary = document.getElementById('daily-report-summary');
    const dailyReportDateBadge = document.getElementById('daily-report-date-badge');
    if (!dailyReportSummary) return;

    const day = (reportDayInput && reportDayInput.value) ? reportDayInput.value : new Date().toISOString().slice(0, 10);
    if (dailyReportDateBadge) {
      dailyReportDateBadge.textContent = SmartLabUtils.formatDate(day);
    }

    const report = await SmartLabData.getDailyReport(day);
    const entries = Object.entries(report.byDepartment || {}).map(([department, count]) => `
      <li><span>${department}</span><strong>${count} sessions</strong></li>
    `).join('');

    dailyReportSummary.innerHTML = `
      <div class="report-summary-grid">
        <div><span>Report Date</span><strong>${SmartLabUtils.formatDate(day)}</strong></div>
        <div><span>Daily Sessions</span><strong>${report.totalRecords || 0}</strong></div>
        <div><span>Total Lab Hours</span><strong>${(report.totalHours || 0).toFixed(1)}h</strong></div>
      </div>
      <div class="report-breakdown" style="margin-top: 14px;">
        <h4>Daily Department Breakdown</h4>
        <ul class="dept-split-list">${entries || '<li><span>No sessions recorded for this day</span><strong>0</strong></li>'}</ul>
      </div>
    `;
  }

  async function generateMonthlyReport() {
    const month = reportMonthInput.value;
    const report = await SmartLabData.getMonthlyReport(month || '');

    const entries = Object.entries(report.byDepartment || {}).map(([department, count]) => `
      <li><span>${department}</span><strong>${count} sessions</strong></li>
    `).join('');

    monthlyReportSummary.innerHTML = `
      <div class="report-summary-grid">
        <div><span>Month</span><strong>${month || 'All-Time'}</strong></div>
        <div><span>Total Sessions</span><strong>${report.totalRecords || 0}</strong></div>
        <div><span>Total Lab Hours</span><strong>${(report.totalHours || 0).toFixed(1)}h</strong></div>
      </div>
      <div class="report-breakdown" style="margin-top: 14px;">
        <h4>Department Distribution</h4>
        <ul class="dept-split-list">${entries || '<li><span>No sessions logged for this month</span><strong>0</strong></li>'}</ul>
      </div>
    `;
  }

  /* RENDER CHARTS */
  async function renderCharts() {
    const usageCtx = document.getElementById('usage-trend-chart');
    const departmentCtx = document.getElementById('department-chart');
    const statusCtx = document.getElementById('status-chart');

    if (!usageCtx || !departmentCtx || !statusCtx) return;

    if (window.smartLabChartInstances) {
      Object.values(window.smartLabChartInstances).forEach((chart) => chart && chart.destroy && chart.destroy());
    }
    window.smartLabChartInstances = {};

    const state = await SmartLabData.loadState();
    const trend = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const usageValues = (state.records || []).length ? [
      Math.max(1, (state.records || []).filter((r) => (r.bookedDate || '').includes('10-14')).length * 2),
      Math.max(2, (state.records || []).length * 1.5),
      Math.max(4, (state.records || []).length * 2.2),
      Math.max(3, (state.records || []).length * 1.8),
      Math.max(2, (state.records || []).length * 1.4),
      Math.max(1, (state.records || []).length * 0.8)
    ] : [14, 22, 28, 19, 18, 12];

    window.smartLabChartInstances.usage = new Chart(usageCtx, {
      type: 'line',
      data: {
        labels: trend,
        datasets: [{
          label: 'Total Hours Logged',
          data: usageValues,
          borderColor: '#4f46e5',
          backgroundColor: 'rgba(79, 70, 229, 0.15)',
          tension: 0.35,
          fill: true,
          pointBackgroundColor: '#4f46e5',
          pointRadius: 4
        }]
      },
      options: { responsive: true, maintainAspectRatio: false, animation: { duration: 400 } }
    });

    const departmentLabels = SmartLabUtils.uniqueValues(state.records || [], 'department');
    const finalLabels = departmentLabels.length ? departmentLabels : ['CSE', 'AI & DS', 'ECE', 'EEE', 'MECH'];
    const departmentCounts = finalLabels.map((dept) => {
      const c = (state.records || []).filter((r) => r.department === dept).length;
      return c || 3;
    });

    window.smartLabChartInstances.department = new Chart(departmentCtx, {
      type: 'doughnut',
      data: {
        labels: finalLabels,
        datasets: [{
          data: departmentCounts,
          backgroundColor: ['#4f46e5', '#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6']
        }]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
    });

    const summary = await SmartLabData.getComputerStatusSummary();
    window.smartLabChartInstances.status = new Chart(statusCtx, {
      type: 'bar',
      data: {
        labels: ['Available', 'In Use / Occupied', 'Offline', 'Maintenance'],
        datasets: [{
          label: 'Workstations Count',
          data: [summary.available, summary.inUse, summary.offline, summary.maintenance || 0],
          backgroundColor: ['#10b981', '#3b82f6', '#64748b', '#f59e0b'],
          borderRadius: 8
        }]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
    });
  }

  /* WORKSTATION MODAL & ACTION CONTROLS */
  async function openComputerModal(computerId) {
    const state = await SmartLabData.loadState();
    const pc = (state.computers || []).find((c) => c.id === computerId);
    if (!pc) return;

    const isOccupied = pc.status === 'IN_USE';
    const statusCls = formatStatusClass(pc.status);

    modalBody.innerHTML = `
      <div class="summary-card">
        <div class="row"><span>Workstation ID</span><strong>${pc.id}</strong></div>
        <div class="row"><span>Status</span><span class="status-tag ${statusCls}">${getStatusLabel(pc.status)}</span></div>
        <div class="row"><span>Assigned Student</span><strong>${pc.studentName || '— (No active student)'}</strong></div>
        <div class="row"><span>Department</span><strong>${pc.department || '—'}</strong></div>
        <div class="row"><span>Last Monitored</span><strong>${SmartLabUtils.formatDate(pc.lastSeen?.slice(0, 10))}</strong></div>
        ${isOccupied && pc.currentBooking ? `<div class="row"><span>Scheduled Slot</span><strong>${pc.currentBooking.start} - ${pc.currentBooking.end}</strong></div>` : ''}
      </div>
    `;

    modalActions.innerHTML = `
      <div class="modal-action-buttons">
        ${isOccupied ? `
          <button type="button" class="btn btn-primary" id="modal-release-btn">⚡ Release to Available</button>
        ` : `
          <button type="button" class="btn btn-outline-success" id="modal-set-avail-btn">Mark Available</button>
        `}
        <button type="button" class="btn btn-secondary" id="modal-set-maint-btn">Toggle Maintenance</button>
        <button type="button" class="btn btn-ghost" id="modal-set-off-btn">Set Offline</button>
      </div>
    `;

    // Action handlers inside modal
    const releaseBtn = document.getElementById('modal-release-btn');
    if (releaseBtn) {
      releaseBtn.addEventListener('click', async () => {
        releaseBtn.disabled = true;
        releaseBtn.textContent = 'Releasing...';
        await SmartLabData.releaseComputer(pc.id);
        SmartLabUtils.showToast(`${pc.id} released and set to Available.`, 'success');
        computerModal.classList.add('hidden');
        await renderAll(true);
      });
    }

    const setAvailBtn = document.getElementById('modal-set-avail-btn');
    if (setAvailBtn) {
      setAvailBtn.addEventListener('click', async () => {
        await SmartLabData.setComputerStatus(pc.id, 'AVAILABLE');
        SmartLabUtils.showToast(`${pc.id} marked Available.`, 'success');
        computerModal.classList.add('hidden');
        await renderAll(true);
      });
    }

    const setMaintBtn = document.getElementById('modal-set-maint-btn');
    if (setMaintBtn) {
      setMaintBtn.addEventListener('click', async () => {
        const next = pc.status === 'MAINTENANCE' ? 'AVAILABLE' : 'MAINTENANCE';
        await SmartLabData.setComputerStatus(pc.id, next);
        SmartLabUtils.showToast(`${pc.id} status updated to ${next}.`, 'info');
        computerModal.classList.add('hidden');
        await renderAll(true);
      });
    }

    const setOffBtn = document.getElementById('modal-set-off-btn');
    if (setOffBtn) {
      setOffBtn.addEventListener('click', async () => {
        await SmartLabData.setComputerStatus(pc.id, 'OFFLINE');
        SmartLabUtils.showToast(`${pc.id} status updated to Offline.`, 'warning');
        computerModal.classList.add('hidden');
        await renderAll(true);
      });
    }

    computerModal.classList.remove('hidden');
  }

  /* RENDER ALL VIEWS */
  async function renderAll(forceFresh = false) {
    await renderDashboard(forceFresh);
    if (activeSection === 'computers') await renderComputerGrid();
    if (activeSection === 'records') await renderRecords();
    if (activeSection === 'students') await renderStudents();
    if (activeSection === 'staff') await renderStaff();
    if (activeSection === 'reports') await renderReports();
    if (activeSection === 'analytics') await renderCharts();
  }

  /* AUTO-POLLING TELEMETRY */
  function startAutoPolling() {
    if (autoPollTimer) clearInterval(autoPollTimer);
    autoPollTimer = setInterval(async () => {
      const pollCheck = document.getElementById('setting-auto-poll');
      if (pollCheck && !pollCheck.checked) return;
      if (!isAdminLoggedIn()) return;

      const autoReleaseCheck = document.getElementById('setting-auto-release');
      if (!autoReleaseCheck || autoReleaseCheck.checked) {
        try {
          const res = await SmartLabData.autoReleaseExpiredComputers();
          if (res && res.releasedCount > 0) {
            SmartLabUtils.showToast(`⏱️ ${res.releasedCount} workstation session(s) ended & auto-released to Available.`, 'info');
          }
        } catch (e) {}
      }

      // Silently refresh dashboard & active section
      await renderDashboard(true);
      if (activeSection === 'computers') await renderComputerGrid();
      if (activeSection === 'records') await renderRecords();
      if (activeSection === 'students') await renderStudents();
    }, 4000);
  }

  // Subscribe to instant cross-tab live updates from student submissions & auto-releases!
  SmartLabData.subscribeTelemetry(async (detail) => {
    if (isAdminLoggedIn()) {
      if (detail && detail.autoReleased && detail.releasedPcIds && detail.releasedPcIds.length) {
        SmartLabUtils.showToast(`⏱️ Workstation(s) ${detail.releasedPcIds.join(', ')} session ended & auto-released to Available.`, 'info');
      } else {
        SmartLabUtils.showToast('Live telemetry update received from lab database.', 'info');
      }
      await renderAll(true);
    }
  });

  /* EVENT LISTENERS */
  document.getElementById('logout-btn').addEventListener('click', () => {
    setAdminSession(false);
    showAdminLogin();
  });

  loginForm.addEventListener('submit', async function (event) {
    event.preventDefault();
    const formData = new FormData(loginForm);
    const username = (formData.get('username') || '').toString().trim();
    const password = (formData.get('password') || '').toString().trim();

    const result = await SmartLabData.loginAdmin(username, password);
    if (result.ok) {
      setAdminSession(true);
      showAdminDashboard();
      setPage('dashboard');
      await renderAll(true);
      SmartLabUtils.showToast('Admin control panel unlocked.', 'success');
      return;
    }

    loginError.textContent = result.message || 'Invalid username or password.';
    loginError.classList.remove('hidden');
    SmartLabUtils.showToast(result.message || 'Invalid credentials.', 'error');
  });

  navItems.forEach((item) => {
    item.addEventListener('click', async () => {
      const section = item.dataset.section;
      setPage(section);
      if (section === 'dashboard') await renderDashboard();
      if (section === 'computers') await renderComputerGrid();
      if (section === 'records') await renderRecords();
      if (section === 'students') await renderStudents();
      if (section === 'staff') await renderStaff();
      if (section === 'reports') await renderReports();
      if (section === 'analytics') await renderCharts();
    });
  });

  // Search & Filter listeners
  const compSearch = document.getElementById('computer-search');
  if (compSearch) compSearch.addEventListener('input', renderComputerGrid);
  const compFilter = document.getElementById('computer-filter');
  if (compFilter) compFilter.addEventListener('change', renderComputerGrid);

  const recSearch = document.getElementById('record-search');
  if (recSearch) recSearch.addEventListener('input', renderRecords);
  const recFilter = document.getElementById('record-status-filter');
  if (recFilter) recFilter.addEventListener('change', renderRecords);

  const studentSearch = document.getElementById('student-search');
  if (studentSearch) studentSearch.addEventListener('input', renderStudents);
  const studentDeptFilter = document.getElementById('student-dept-filter');
  if (studentDeptFilter) studentDeptFilter.addEventListener('change', renderStudents);
  const studentYearFilter = document.getElementById('student-year-filter');
  if (studentYearFilter) studentYearFilter.addEventListener('change', renderStudents);

  const staffSearch = document.getElementById('staff-search');
  if (staffSearch) staffSearch.addEventListener('input', renderStaff);
  const staffFilter = document.getElementById('staff-dept-filter');
  if (staffFilter) staffFilter.addEventListener('change', renderStaff);

  // Overall Delete All Usage Records Button
  if (clearAllRecordsBtn) {
    clearAllRecordsBtn.addEventListener('click', async () => {
      const confirmed = confirm('⚠️ WARNING: Are you sure you want to permanently DELETE ALL usage records from the database?\n\nThis will purge all history and free any active workstations. This action cannot be undone.');
      if (!confirmed) return;

      clearAllRecordsBtn.disabled = true;
      clearAllRecordsBtn.textContent = 'Purging Records...';
      try {
        await SmartLabData.clearAllUsageRecords();
        SmartLabUtils.showToast('All lab usage records deleted successfully.', 'success');
        await renderAll(true);
      } catch (err) {
        SmartLabUtils.showToast('Failed to delete all records: ' + (err.message || 'Error'), 'error');
      } finally {
        clearAllRecordsBtn.disabled = false;
        clearAllRecordsBtn.textContent = '🗑️ Delete All Records';
      }
    });
  }

  // Add / Edit Student Login Form & Toggle
  if (openAddStudentBtn) {
    openAddStudentBtn.addEventListener('click', () => {
      studentForm.reset();
      studentFormId.value = '';
      studentModalTitle.textContent = 'Add Student Login Credential';
      studentFormError.classList.add('hidden');
      studentModal.classList.remove('hidden');
    });
  }

  // Student Excel / CSV Upload Handler
  if (studentExcelInput) {
    studentExcelInput.addEventListener('change', async function () {
      const file = studentExcelInput.files && studentExcelInput.files[0];
      if (!file) return;

      if (studentImportStatus) {
        studentImportStatus.style.display = 'block';
        studentImportStatus.innerHTML = `
          <div class="panel-box" style="padding: 12px 16px; border-left: 4px solid var(--primary-600); background: #f0fdf4;">
            <p style="margin: 0; color: var(--primary-800); font-weight: 600;">⏳ Uploading and processing ${SmartLabUtils.escapeHtml(file.name)}...</p>
          </div>
        `;
      }

      try {
        const formData = new FormData();
        formData.append('file', file);
        const result = await SmartLabData.uploadStudentExcel(formData);

        if (result && result.ok) {
          SmartLabUtils.showToast(result.message || 'Students imported successfully!', 'success');
          if (studentImportStatus) {
            studentImportStatus.innerHTML = `
              <div class="panel-box" style="padding: 12px 16px; border-left: 4px solid #10b981; background: #ecfdf5;">
                <p style="margin: 0; color: #065f46; font-weight: 700;">✓ ${SmartLabUtils.escapeHtml(result.message)}</p>
                <p style="margin: 4px 0 0; font-size: 0.85rem; color: #047857;">Student login credentials are registered and active. Students can now immediately log in via the Student Portal.</p>
              </div>
            `;
            setTimeout(() => {
              if (studentImportStatus) studentImportStatus.style.display = 'none';
            }, 6000);
          }
          await SmartLabData.syncFromDatabase();
          renderStudents();
          renderDashboard();
        } else {
          throw new Error(result?.message || 'Failed to import student sheet.');
        }
      } catch (err) {
        SmartLabUtils.showToast(err.message || 'Error processing Excel sheet.', 'danger');
        if (studentImportStatus) {
          studentImportStatus.innerHTML = `
            <div class="panel-box" style="padding: 12px 16px; border-left: 4px solid #ef4444; background: #fef2f2;">
              <p style="margin: 0; color: #991b1b; font-weight: 700;">✗ Import Error: ${SmartLabUtils.escapeHtml(err.message)}</p>
            </div>
          `;
        }
      } finally {
        studentExcelInput.value = '';
      }
    });
  }

  if (studentForm) {
    studentForm.addEventListener('submit', async function (event) {
      event.preventDefault();
      const studentId = studentFormId.value;
      const payload = {
        name: (studentFormName.value || '').trim().toUpperCase(),
        dob: (studentFormDob.value || '').trim(),
        registerNumber: (studentFormReg.value || '').trim().toUpperCase(),
        department: (studentFormDept.value || '').trim(),
        year: (studentFormYear.value || '').trim()
      };

      if (!payload.name || !payload.dob || !payload.registerNumber) {
        studentFormError.textContent = 'Please fill out Student Name, Date of Birth, and Register Number.';
        studentFormError.classList.remove('hidden');
        return;
      }

      const saveBtn = document.getElementById('save-student-btn');
      saveBtn.disabled = true;
      saveBtn.textContent = 'Saving to Database...';

      try {
        if (studentId) {
          await SmartLabData.updateStudent(studentId, payload);
          SmartLabUtils.showToast(`Student ${payload.name} updated successfully!`, 'success');
        } else {
          await SmartLabData.addStudent(payload);
          SmartLabUtils.showToast(`Student ${payload.name} login added successfully!`, 'success');
        }
        studentModal.classList.add('hidden');
        studentForm.reset();
        await renderAll(true);
      } catch (err) {
        studentFormError.textContent = err.message || 'Failed to save student login.';
        studentFormError.classList.remove('hidden');
      } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save Student Login';
      }
    });
  }

  // Add Computer Toggle & Form
  if (addComputerBtn) {
    addComputerBtn.addEventListener('click', () => {
      computerFormPanel.classList.remove('hidden');
    });
  }
  if (cancelComputerFormBtn) {
    cancelComputerFormBtn.addEventListener('click', () => {
      computerFormPanel.classList.add('hidden');
      addComputerForm.reset();
      computerFormError.classList.add('hidden');
    });
  }

  addComputerForm.addEventListener('submit', async function (event) {
    event.preventDefault();
    const formData = new FormData(addComputerForm);
    const computerId = (formData.get('computerId') || '').toString().trim().toUpperCase();
    const status = (formData.get('status') || '').toString().trim() || 'AVAILABLE';
    const studentName = (formData.get('studentName') || '').toString().trim();

    if (!computerId) {
      computerFormError.textContent = 'Workstation ID is required (e.g. LAB-PC-61).';
      computerFormError.classList.remove('hidden');
      return;
    }

    try {
      await SmartLabData.addComputer({
        computerId,
        status,
        studentName,
        department: status === 'IN_USE' ? 'General' : ''
      });
      computerFormPanel.classList.add('hidden');
      addComputerForm.reset();
      computerFormError.classList.add('hidden');
      await renderComputerGrid();
      await renderDashboard();
      SmartLabUtils.showToast(`Workstation ${computerId} added to database.`, 'success');
    } catch (err) {
      computerFormError.textContent = err.message || 'Failed to add computer.';
      computerFormError.classList.remove('hidden');
    }
  });

  // Export Records to CSV
  const exportRecBtn = document.getElementById('export-records-table-btn');
  if (exportRecBtn) {
    exportRecBtn.addEventListener('click', async () => {
      const state = await SmartLabData.loadState();
      const headers = ['studentName', 'registerNumber', 'computerId', 'department', 'bookedDate', 'startTime', 'endTime', 'durationHours', 'status'];
      const rows = (state.records || []).map((r) => headers.map((k) => `"${String(r[k] ?? '').replace(/"/g, '""')}"`).join(','));
      const csv = [headers.join(','), ...rows].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `smartlab-records-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      SmartLabUtils.showToast('Records exported to CSV.', 'info');
    });
  }

  // Daily Report & Export
  const genDailyBtn = document.getElementById('generate-daily-report');
  if (genDailyBtn) genDailyBtn.addEventListener('click', generateDailyReport);
  const reportDayInput = document.getElementById('report-day');
  if (reportDayInput) reportDayInput.addEventListener('change', generateDailyReport);

  const expDailyBtn = document.getElementById('export-daily-report');
  if (expDailyBtn) {
    expDailyBtn.addEventListener('click', async () => {
      const day = reportDayInput ? reportDayInput.value : '';
      const report = await SmartLabData.getDailyReport(day);
      const headers = ['studentName', 'registerNumber', 'department', 'computerId', 'bookedDate', 'startTime', 'endTime', 'durationHours', 'status'];
      const rows = (report.records || []).map((r) => headers.map((k) => `"${String(r[k] ?? '').replace(/"/g, '""')}"`).join(','));
      const csv = [headers.join(','), ...rows].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `daily-report-${day || new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      SmartLabUtils.showToast('Daily CSV report downloaded.', 'info');
    });
  }

  // Monthly Report & Export
  const genMonthBtn = document.getElementById('generate-monthly-report');
  if (genMonthBtn) genMonthBtn.addEventListener('click', generateMonthlyReport);
  if (reportMonthInput) reportMonthInput.addEventListener('change', generateMonthlyReport);

  const expMonthBtn = document.getElementById('export-monthly-report');
  if (expMonthBtn) {
    expMonthBtn.addEventListener('click', async () => {
      const month = reportMonthInput.value;
      const report = await SmartLabData.getMonthlyReport(month || '');
      const headers = ['studentName', 'registerNumber', 'department', 'computerId', 'bookedDate', 'startTime', 'endTime', 'durationHours'];
      const rows = (report.records || []).map((r) => headers.map((k) => `"${String(r[k] ?? '').replace(/"/g, '""')}"`).join(','));
      const csv = [headers.join(','), ...rows].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${month || 'all-time'}-usage-report.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      SmartLabUtils.showToast('Monthly CSV report downloaded.', 'info');
    });
  }

  const expAllBtn = document.getElementById('export-report');
  if (expAllBtn) {
    expAllBtn.addEventListener('click', async () => {
      const state = await SmartLabData.loadState();
      const headers = ['id', 'studentName', 'registerNumber', 'department', 'computerId', 'bookedDate', 'startTime', 'endTime', 'durationHours', 'status'];
      const rows = (state.records || []).map((r) => headers.map((k) => `"${String(r[k] ?? '').replace(/"/g, '""')}"`).join(','));
      const csv = [headers.join(','), ...rows].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `smartlab-full-database-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      SmartLabUtils.showToast('Full database dump exported.', 'info');
    });
  }

  // RECORD ALTERATION MODAL
  const recordModal = document.getElementById('record-modal');
  const recordEditForm = document.getElementById('record-edit-form');
  const recordEditId = document.getElementById('record-edit-id');
  const recordEditStudent = document.getElementById('record-edit-student');
  const recordEditRegister = document.getElementById('record-edit-register');
  const recordEditDept = document.getElementById('record-edit-dept');
  const recordEditPc = document.getElementById('record-edit-pc');
  const recordEditStart = document.getElementById('record-edit-start');
  const recordEditEnd = document.getElementById('record-edit-end');
  const recordEditDate = document.getElementById('record-edit-date');
  const recordEditStatus = document.getElementById('record-edit-status');
  const recordEditError = document.getElementById('record-edit-error');

  function openRecordEditModal(record) {
    if (!recordModal) return;
    recordEditId.value = record.id;
    recordEditStudent.value = record.studentName || '';
    recordEditRegister.value = record.registerNumber || '';
    recordEditDept.value = record.department || 'CSE';
    recordEditPc.value = record.computerId || '';
    recordEditStart.value = record.startTime || '09:00';
    recordEditEnd.value = record.endTime || '10:30';
    recordEditDate.value = record.bookedDate || new Date().toISOString().slice(0, 10);
    recordEditStatus.value = record.status || 'IN_USE';
    recordEditError.classList.add('hidden');
    recordModal.classList.remove('hidden');
  }

  if (recordEditForm) {
    recordEditForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      const recId = recordEditId.value;
      const payload = {
        studentName: recordEditStudent.value.trim(),
        registerNumber: recordEditRegister.value.trim(),
        department: recordEditDept.value.trim(),
        computerId: recordEditPc.value.trim(),
        startTime: recordEditStart.value.trim(),
        endTime: recordEditEnd.value.trim(),
        bookedDate: recordEditDate.value.trim(),
        status: recordEditStatus.value.trim()
      };

      if (!payload.studentName || !payload.registerNumber || !payload.computerId) {
        recordEditError.textContent = 'Please complete all required fields.';
        recordEditError.classList.remove('hidden');
        return;
      }

      const saveBtn = document.getElementById('save-record-edit-btn');
      if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.textContent = 'Saving Alterations...';
      }

      try {
        await SmartLabData.updateUsageRecord(recId, payload);
        recordModal.classList.add('hidden');
        SmartLabUtils.showToast(`Record updated & workstation ${payload.computerId} status synchronized!`, 'success');
        await renderAll(true);
      } catch (err) {
        recordEditError.textContent = err.message || 'Failed to update record.';
        recordEditError.classList.remove('hidden');
      } finally {
        if (saveBtn) {
          saveBtn.disabled = false;
          saveBtn.textContent = 'Save Alterations & Sync';
        }
      }
    });
  }

  // PASSWORD FIXER FORM
  const changePasswordForm = document.getElementById('change-password-form');
  const currentAdminPass = document.getElementById('current-admin-pass');
  const newAdminPass = document.getElementById('new-admin-pass');
  const confirmAdminPass = document.getElementById('confirm-admin-pass');
  const changePassError = document.getElementById('change-pass-error');
  const changePassSuccess = document.getElementById('change-pass-success');

  if (changePasswordForm) {
    changePasswordForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      changePassError.classList.add('hidden');
      changePassSuccess.classList.add('hidden');

      const currentPass = (currentAdminPass?.value || '').trim();
      const newPass = (newAdminPass?.value || '').trim();
      const confirmPass = (confirmAdminPass?.value || '').trim();

      if (!currentPass || !newPass || !confirmPass) {
        changePassError.textContent = 'Please enter your current password and specify a new password.';
        changePassError.classList.remove('hidden');
        return;
      }

      if (newPass.length < 4) {
        changePassError.textContent = 'New password must be at least 4 characters long.';
        changePassError.classList.remove('hidden');
        return;
      }

      if (newPass !== confirmPass) {
        changePassError.textContent = 'New password and confirmation password do not match.';
        changePassError.classList.remove('hidden');
        return;
      }

      const savePassBtn = document.getElementById('save-password-btn');
      if (savePassBtn) {
        savePassBtn.disabled = true;
        savePassBtn.textContent = 'Updating Password...';
      }

      try {
        const res = await SmartLabData.changeAdminPassword(currentPass, newPass);
        if (res && res.ok) {
          changePassSuccess.textContent = 'Password updated successfully! Next login requires your new password.';
          changePassSuccess.classList.remove('hidden');
          changePasswordForm.reset();
          SmartLabUtils.showToast('Admin password changed successfully!', 'success');
        } else {
          throw new Error(res?.message || 'Password update failed');
        }
      } catch (err) {
        changePassError.textContent = err.message || 'Error updating password. Please verify current password.';
        changePassError.classList.remove('hidden');
        SmartLabUtils.showToast('Error changing password.', 'error');
      } finally {
        if (savePassBtn) {
          savePassBtn.disabled = false;
          savePassBtn.textContent = 'Update Password Now';
        }
      }
    });
  }

  // Close modals on clicking overlay or close button
  document.querySelectorAll('[data-close="true"]').forEach((elem) => {
    elem.addEventListener('click', () => {
      if (computerModal) computerModal.classList.add('hidden');
      if (staffModal) staffModal.classList.add('hidden');
      if (deleteStaffModal) deleteStaffModal.classList.add('hidden');
      if (recordModal) recordModal.classList.add('hidden');
      if (studentModal) studentModal.classList.add('hidden');
    });
  });

  // Initialization check
  if (isAdminLoggedIn()) {
    showAdminDashboard();
    setPage('dashboard');
    await renderAll(true);
  } else {
    showAdminLogin();
  }
});
