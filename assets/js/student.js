document.addEventListener('DOMContentLoaded', async function () {
  // Authentication Elements
  const loginPanel = document.getElementById('login-panel');
  const loginForm = document.getElementById('student-login-form');
  const loginStudentName = document.getElementById('login-student-name');
  const loginStudentDob = document.getElementById('login-student-dob');
  const loginError = document.getElementById('login-error');
  const studentUserPill = document.getElementById('student-user-pill');
  const headerStudentName = document.getElementById('header-student-name');
  const logoutStudentBtn = document.getElementById('logout-student-btn');
  const headerBackHome = document.getElementById('header-back-home');
  const backHomeBtn = document.getElementById('back-home-btn');

  // Tab Bar Elements
  const studentTabBar = document.getElementById('student-tab-bar');
  const tabBtnWorkstations = document.getElementById('tab-btn-workstations');
  const tabBtnSchedule = document.getElementById('tab-btn-schedule');
  const tabAvailBadge = document.getElementById('tab-avail-badge');

  // Booking & Telemetry Elements
  const form = document.getElementById('usage-form');
  const startRecordingBtn = document.getElementById('start-recording-btn');
  const cancelFormBtn = document.getElementById('cancel-form-btn');
  const welcomePanel = document.getElementById('welcome-panel');
  const formPanel = document.getElementById('form-panel');
  const successPanel = document.getElementById('success-panel');
  const computerStatusBadge = document.getElementById('computer-status-badge');
  const computerIdInput = document.getElementById('computer-id');
  const summaryCard = document.getElementById('summary-card');
  const formError = document.getElementById('form-error');

  // Telemetry elements
  const telemetryAvailCount = document.getElementById('telemetry-avail-count');
  const telemetryInuseCount = document.getElementById('telemetry-inuse-count');
  const telemetryOffCount = document.getElementById('telemetry-off-count');
  const assignedPcLabel = document.getElementById('assigned-pc-label');
  const btnTargetPc = document.getElementById('btn-target-pc');
  const chipPcId = document.getElementById('chip-pc-id');
  const stuMeterAvail = document.getElementById('stu-meter-avail');
  const stuMeterInuse = document.getElementById('stu-meter-inuse');
  const stuMeterOff = document.getElementById('stu-meter-off');
  const barAvailText = document.getElementById('bar-avail-text');
  const barInuseText = document.getElementById('bar-inuse-text');
  const barOffText = document.getElementById('bar-off-text');
  const studentPcGrid = document.getElementById('student-pc-grid');
  const dateBookedInput = document.getElementById('date-booked');
  const startTimeInput = document.getElementById('start-time');
  const endTimeInput = document.getElementById('end-time');
  const calcDurationText = document.getElementById('calc-duration-text');

  // 12-Hour Schedule Controls
  const startHourSelect = document.getElementById('start-hour');
  const startMinSelect = document.getElementById('start-min');
  const startPeriodAm = document.getElementById('start-period-am');
  const startPeriodPm = document.getElementById('start-period-pm');
  const endHourSelect = document.getElementById('end-hour');
  const endMinSelect = document.getElementById('end-min');
  const endPeriodAm = document.getElementById('end-period-am');
  const endPeriodPm = document.getElementById('end-period-pm');

  let startPeriod = 'AM';
  let endPeriod = 'AM';
  let selectedComputerId = 'LAB-PC-01';
  let currentStudent = null;

  function setActivePanel(panelName) {
    if (loginPanel) loginPanel.classList.toggle('active', panelName === 'login');
    if (welcomePanel) welcomePanel.classList.toggle('active', panelName === 'welcome');
    if (formPanel) formPanel.classList.toggle('active', panelName === 'form');
    if (successPanel) successPanel.classList.toggle('active', panelName === 'success');

    // Tab Bar visibility and active state
    if (studentTabBar) {
      if (panelName === 'welcome' || panelName === 'form') {
        studentTabBar.classList.remove('hidden');
        if (tabBtnWorkstations) tabBtnWorkstations.classList.toggle('active', panelName === 'welcome');
        if (tabBtnSchedule) tabBtnSchedule.classList.toggle('active', panelName === 'form');
      } else {
        studentTabBar.classList.add('hidden');
      }
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function getStoredStudent() {
    try {
      const raw = sessionStorage.getItem('smartlab_student');
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function updateStudentHeader(student) {
    if (!studentUserPill) return;
    if (student) {
      studentUserPill.classList.remove('hidden');
      if (headerStudentName) headerStudentName.textContent = student.name;
    } else {
      studentUserPill.classList.add('hidden');
    }
  }

  function prefillStudentFields(student) {
    if (!student) return;
    const nameInput = document.getElementById('student-name');
    const regInput = document.getElementById('register-number');
    const deptSelect = document.getElementById('department');
    const yearSelect = document.getElementById('year');

    if (nameInput) {
      nameInput.value = student.name;
      nameInput.readOnly = true;
    }
    if (regInput && student.registerNumber) {
      regInput.value = student.registerNumber;
    }
    if (deptSelect && student.department) {
      deptSelect.value = student.department;
    }
    if (yearSelect && student.year) {
      yearSelect.value = student.year;
    }
  }

  async function hydrateEnrolledStudentsDatalist() {
    const enrolledDatalist = document.getElementById('enrolled-students-list');
    if (!enrolledDatalist) return;
    try {
      const state = await SmartLabData.loadState();
      const students = state?.students || [];
      const uniqueNames = [...new Set(students.map((s) => s.name))];
      enrolledDatalist.innerHTML = uniqueNames
        .map((n) => `<option value="${SmartLabUtils.escapeHtml(n)}"></option>`)
        .join('');
    } catch (e) { }
  }

  // Automated Student Logout
  function automateLogout() {
    sessionStorage.removeItem('smartlab_student');
    currentStudent = null;
    updateStudentHeader(null);
    if (studentTabBar) studentTabBar.classList.add('hidden');
    if (loginForm) loginForm.reset();
    if (loginError) loginError.classList.add('hidden');
    setActivePanel('login');
  }

  // Back to Home automated logout
  if (headerBackHome) {
    headerBackHome.addEventListener('click', () => {
      automateLogout();
    });
  }

  if (backHomeBtn) {
    backHomeBtn.addEventListener('click', () => {
      automateLogout();
    });
  }

  if (logoutStudentBtn) {
    logoutStudentBtn.addEventListener('click', () => {
      automateLogout();
      SmartLabUtils.showToast('Logged out of student portal.', 'info');
    });
  }

  // Tab Bar Switching
  if (tabBtnWorkstations) {
    tabBtnWorkstations.addEventListener('click', () => {
      if (!currentStudent) {
        setActivePanel('login');
        return;
      }
      setActivePanel('welcome');
    });
  }

  if (tabBtnSchedule) {
    tabBtnSchedule.addEventListener('click', () => {
      if (!currentStudent) {
        setActivePanel('login');
        return;
      }
      openBookingForm(selectedComputerId);
    });
  }

  // Student Login Form Handler
  if (loginForm) {
    loginForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      const name = (loginStudentName?.value || '').trim();
      const dob = (loginStudentDob?.value || '').trim();

      if (!name || !dob) {
        if (loginError) {
          loginError.textContent = 'Please enter both your Student Full Name and Date of Birth.';
          loginError.classList.remove('hidden');
        }
        SmartLabUtils.showToast('Name and Date of Birth are required.', 'error');
        return;
      }

      const submitBtn = document.getElementById('login-submit-btn');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span>Verifying credentials...</span>';
      }

      try {
        const res = await SmartLabData.loginStudent(name, dob);
        if (res && res.ok && res.student) {
          currentStudent = res.student;
          sessionStorage.setItem('smartlab_student', JSON.stringify(currentStudent));
          updateStudentHeader(currentStudent);
          prefillStudentFields(currentStudent);
          if (loginError) loginError.classList.add('hidden');
          SmartLabUtils.showToast(`Verified! Welcome ${currentStudent.name}`, 'success');
          await populateTelemetryAndGrid(true);
          setActivePanel('welcome');
        } else {
          throw new Error(res?.message || 'Invalid Student Name or Date of Birth. Access denied.');
        }
      } catch (err) {
        if (loginError) {
          loginError.textContent = err.message || 'Invalid Student Name or Date of Birth. Access denied.';
          loginError.classList.remove('hidden');
        }
        SmartLabUtils.showToast('Verification failed. Invalid Name or DOB.', 'error');
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = '<span>⚡ Verify Credentials & Open Portal</span>';
        }
      }
    });
  }

  // =========================================================
  // 12-HOUR TIME SCHEDULE LOGIC
  // =========================================================
  function setPeriod(type, period) {
    if (type === 'start') {
      startPeriod = period;
      if (startPeriodAm) startPeriodAm.classList.toggle('active', period === 'AM');
      if (startPeriodPm) startPeriodPm.classList.toggle('active', period === 'PM');
    } else {
      endPeriod = period;
      if (endPeriodAm) endPeriodAm.classList.toggle('active', period === 'AM');
      if (endPeriodPm) endPeriodPm.classList.toggle('active', period === 'PM');
    }
    sync12hToInputs();
  }

  function apply12hTime(type, timeStr) {
    if (!timeStr) return;
    const raw = timeStr.trim();
    const parts = raw.split(' ');
    const timeParts = (parts[0] || '').split(':');
    const period = (parts[1] || 'AM').toUpperCase();

    const hh = String(timeParts[0] || '09').padStart(2, '0');
    const mm = String(timeParts[1] || '00').padStart(2, '0');

    if (type === 'start') {
      if (startHourSelect) startHourSelect.value = hh;
      if (startMinSelect) startMinSelect.value = mm;
      startPeriod = period;
      if (startPeriodAm) startPeriodAm.classList.toggle('active', period === 'AM');
      if (startPeriodPm) startPeriodPm.classList.toggle('active', period === 'PM');
    } else {
      if (endHourSelect) endHourSelect.value = hh;
      if (endMinSelect) endMinSelect.value = mm;
      endPeriod = period;
      if (endPeriodAm) endPeriodAm.classList.toggle('active', period === 'AM');
      if (endPeriodPm) endPeriodPm.classList.toggle('active', period === 'PM');
    }
  }

  function sync12hToInputs() {
    const sh = startHourSelect ? startHourSelect.value : '09';
    const sm = startMinSelect ? startMinSelect.value : '00';
    const eh = endHourSelect ? endHourSelect.value : '10';
    const em = endMinSelect ? endMinSelect.value : '30';

    const start12 = `${sh}:${sm} ${startPeriod}`;
    const end12 = `${eh}:${em} ${endPeriod}`;

    if (startTimeInput) startTimeInput.value = start12;
    if (endTimeInput) endTimeInput.value = end12;

    updateDurationCalculation();
  }

  // Attach Period Toggle Buttons
  if (startPeriodAm) startPeriodAm.addEventListener('click', () => setPeriod('start', 'AM'));
  if (startPeriodPm) startPeriodPm.addEventListener('click', () => setPeriod('start', 'PM'));
  if (endPeriodAm) endPeriodAm.addEventListener('click', () => setPeriod('end', 'AM'));
  if (endPeriodPm) endPeriodPm.addEventListener('click', () => setPeriod('end', 'PM'));

  if (startHourSelect) startHourSelect.addEventListener('change', sync12hToInputs);
  if (startMinSelect) startMinSelect.addEventListener('change', sync12hToInputs);
  if (endHourSelect) endHourSelect.addEventListener('change', sync12hToInputs);
  if (endMinSelect) endMinSelect.addEventListener('change', sync12hToInputs);

  function setDefaultTimes() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    if (dateBookedInput && !dateBookedInput.value) {
      dateBookedInput.value = `${year}-${month}-${day}`;
    }

    if (!startTimeInput || !startTimeInput.value) {
      let currentHour = now.getHours();
      let currentMin = Math.ceil(now.getMinutes() / 5) * 5;
      if (currentMin >= 60) {
        currentHour = (currentHour + 1) % 24;
        currentMin = 0;
      }

      const startP = currentHour >= 12 ? 'PM' : 'AM';
      const startH12 = currentHour % 12 || 12;
      const startStr = `${String(startH12).padStart(2, '0')}:${String(currentMin).padStart(2, '0')} ${startP}`;

      // End time 90 minutes later
      const endTotalMinutes = (currentHour * 60 + currentMin + 90) % (24 * 60);
      const endH24 = Math.floor(endTotalMinutes / 60);
      const endM = endTotalMinutes % 60;
      const endP = endH24 >= 12 ? 'PM' : 'AM';
      const endH12 = endH24 % 12 || 12;
      const endStr = `${String(endH12).padStart(2, '0')}:${String(endM).padStart(2, '0')} ${endP}`;

      apply12hTime('start', startStr);
      apply12hTime('end', endStr);
      sync12hToInputs();
    } else {
      apply12hTime('start', startTimeInput.value);
      apply12hTime('end', endTimeInput.value);
      sync12hToInputs();
    }
  }

  function updateDurationCalculation() {
    if (!startTimeInput || !endTimeInput || !calcDurationText) return;
    const start = startTimeInput.value;
    const end = endTimeInput.value;
    if (!start || !end) {
      calcDurationText.textContent = '—';
      return;
    }
    const durationStr = SmartLabUtils.formatDuration(start, end);
    const startMins = SmartLabUtils.parseTimeToMinutes(start);
    const endMins = SmartLabUtils.parseTimeToMinutes(end);
    if (endMins <= startMins) {
      calcDurationText.innerHTML = '<span style="color: #ef4444; font-weight: 700;">⚠️ End time must be later than start time</span>';
    } else {
      calcDurationText.textContent = `${durationStr} (${((endMins - startMins) / 60).toFixed(1)} hrs)`;
    }
  }

  async function populateTelemetryAndGrid(forceFresh = false) {
    const summary = await SmartLabData.getComputerStatusSummary(forceFresh);
    const state = await SmartLabData.loadState(forceFresh);

    // Update Tab Badge
    if (tabAvailBadge) {
      tabAvailBadge.textContent = `${summary.available} Avail`;
    }

    // Update Telemetry Numbers
    if (telemetryAvailCount) telemetryAvailCount.textContent = summary.available;
    if (telemetryInuseCount) telemetryInuseCount.textContent = summary.inUse;
    if (telemetryOffCount) telemetryOffCount.textContent = summary.offline + (summary.maintenance || 0);

    // Progress Bar
    if (stuMeterAvail) stuMeterAvail.style.width = `${summary.availablePct}%`;
    if (stuMeterInuse) stuMeterInuse.style.width = `${summary.occupancyPct}%`;
    const offPct = Math.max(0, 100 - summary.availablePct - summary.occupancyPct).toFixed(1);
    if (stuMeterOff) stuMeterOff.style.width = `${offPct}%`;

    if (barAvailText) barAvailText.textContent = `${summary.availablePct}% (${summary.available} PCs)`;
    if (barInuseText) barInuseText.textContent = `${summary.occupancyPct}% (${summary.inUse} PCs)`;
    if (barOffText) barOffText.textContent = `${offPct}%`;

    // Pick first available machine as recommended
    const availablePcs = (state.computers || []).filter((pc) => pc.status === 'AVAILABLE');
    const recommendedPc = availablePcs[0] || (state.computers || [])[0] || null;

    if (recommendedPc && availablePcs.length > 0) {
      selectedComputerId = recommendedPc.id;
      if (assignedPcLabel) assignedPcLabel.textContent = recommendedPc.id;
      if (btnTargetPc) btnTargetPc.textContent = recommendedPc.id;
      if (chipPcId) chipPcId.textContent = recommendedPc.id;
      if (computerStatusBadge) {
        computerStatusBadge.textContent = `${summary.available} Systems Available`;
        computerStatusBadge.className = 'status-badge success';
      }
    } else {
      if (assignedPcLabel) assignedPcLabel.textContent = 'None';
      if (btnTargetPc) btnTargetPc.textContent = 'All Busy';
      if (computerStatusBadge) {
        computerStatusBadge.textContent = 'Lab Fully Occupied';
        computerStatusBadge.className = 'status-badge error';
      }
    }

    // Render Workstations Selector Matrix
    if (studentPcGrid) {
      studentPcGrid.innerHTML = (state.computers || []).map((pc) => {
        const isAvail = pc.status === 'AVAILABLE';
        const isOccupied = pc.status === 'IN_USE';
        const isSelected = pc.id === selectedComputerId;
        const statusClass = (pc.status || 'AVAILABLE').toLowerCase().replace('_', '-');
        const shortNum = pc.id.replace('LAB-PC-', '');

        return `
          <button type="button" class="pc-node ${statusClass} ${isSelected ? 'selected' : ''}" data-id="${pc.id}" ${!isAvail ? 'title="' + pc.id + ': ' + pc.status + (pc.studentName ? ' by ' + pc.studentName : '') + '"' : ''}>
            <span class="pc-num">${shortNum}</span>
            <span class="pc-status-label">${isAvail ? 'Ready' : isOccupied ? 'Busy' : 'Off'}</span>
          </button>
        `;
      }).join('');

      studentPcGrid.querySelectorAll('.pc-node.available').forEach((btn) => {
        btn.addEventListener('click', () => {
          selectedComputerId = btn.dataset.id;
          if (assignedPcLabel) assignedPcLabel.textContent = selectedComputerId;
          if (btnTargetPc) btnTargetPc.textContent = selectedComputerId;
          if (chipPcId) chipPcId.textContent = selectedComputerId;
          if (computerIdInput) computerIdInput.value = selectedComputerId;

          // Highlight selected
          studentPcGrid.querySelectorAll('.pc-node').forEach((n) => n.classList.remove('selected'));
          btn.classList.add('selected');

          // Proceed directly to 12-hour booking schedule form
          openBookingForm(selectedComputerId);
        });
      });
    }

    await hydrateComputerOptions();
  }

  async function hydrateComputerOptions() {
    const state = await SmartLabData.loadState();
    if (!computerIdInput) return;

    const allSystems = (state.computers && state.computers.length)
      ? state.computers
      : Array.from({ length: 60 }, (_, i) => ({ id: `LAB-PC-${String(i + 1).padStart(2, '0')}`, status: 'AVAILABLE' }));

    computerIdInput.innerHTML = [
      '<option value="">Select a workstation...</option>',
      ...allSystems.map((pc) => {
        const isAvail = pc.status === 'AVAILABLE';
        const label = `${pc.id} (${pc.status === 'AVAILABLE' ? '🟢 Available' : pc.status === 'IN_USE' ? '🔵 In Use' : '⚪ ' + pc.status})`;
        return `<option value="${pc.id}" ${isAvail ? '' : 'disabled'} ${pc.id === selectedComputerId ? 'selected' : ''}>${label}</option>`;
      })
    ].join('');
  }

  function openBookingForm(pcId) {
    if (!currentStudent) {
      SmartLabUtils.showToast('Please log in with your Name and Date of Birth first.', 'error');
      setActivePanel('login');
      return;
    }
    selectedComputerId = pcId || selectedComputerId;
    if (computerIdInput) computerIdInput.value = selectedComputerId;
    if (chipPcId) chipPcId.textContent = selectedComputerId;
    if (btnTargetPc) btnTargetPc.textContent = selectedComputerId;
    prefillStudentFields(currentStudent);
    setDefaultTimes();
    setActivePanel('form');
  }

  if (startRecordingBtn) {
    startRecordingBtn.addEventListener('click', () => {
      openBookingForm(selectedComputerId);
    });
  }

  if (cancelFormBtn) {
    cancelFormBtn.addEventListener('click', () => {
      setActivePanel('welcome');
    });
  }

  if (computerIdInput) {
    computerIdInput.addEventListener('change', () => {
      selectedComputerId = computerIdInput.value;
      if (chipPcId) chipPcId.textContent = selectedComputerId;
      if (btnTargetPc) btnTargetPc.textContent = selectedComputerId;
    });
  }

  function showSummary(data) {
    const duration = SmartLabUtils.formatDuration(data.startTime, data.endTime);
    summaryCard.innerHTML = `
      <div class="receipt-header">
        <div class="receipt-brand">SmartLab Monitor · Official Usage Pass</div>
        <div class="receipt-id">Pass Ref: <strong>${data.id || 'R-' + Date.now()}</strong></div>
      </div>
      <div class="receipt-body">
        <div class="receipt-workstation">
          <span class="rw-label">ASSIGNED WORKSTATION</span>
          <strong class="rw-pc">${SmartLabUtils.escapeHtml(data.computerId)}</strong>
          <span class="rw-status">Active Session Verified</span>
        </div>
        <div class="receipt-grid">
          <div class="row"><span>Student Name</span><strong>${SmartLabUtils.escapeHtml(data.studentName)}</strong></div>
          <div class="row"><span>Register Number</span><strong>${SmartLabUtils.escapeHtml(data.registerNumber)}</strong></div>
          <div class="row"><span>Department</span><strong>${SmartLabUtils.escapeHtml(data.department)}</strong></div>
          <div class="row"><span>Year of Study</span><strong>${SmartLabUtils.escapeHtml(data.year)}</strong></div>
          <div class="row"><span>Date</span><strong>${SmartLabUtils.formatDate(data.bookedDate)}</strong></div>
          <div class="row"><span>Usage Time (12-Hour)</span><strong>${data.startTime} – ${data.endTime}</strong></div>
          <div class="row"><span>Total Duration</span><strong>${duration} (${data.durationHours || 1.5} hrs)</strong></div>
          <div class="row"><span>Auto-Release Engine</span><strong style="color: #4f46e5;">Automatic Release at ${data.endTime}</strong></div>
          <div class="row"><span>Central Telemetry</span><strong style="color: #059669;">Synchronized with Database</strong></div>
        </div>
      </div>
    `;
  }

  /* SUBMIT RECORD HANDLER */
  form.addEventListener('submit', async function (event) {
    event.preventDefault();
    if (!currentStudent) {
      SmartLabUtils.showToast('Please log in with your Name and Date of Birth first.', 'error');
      setActivePanel('login');
      return;
    }

    const formData = new FormData(form);
    const payload = {
      studentName: currentStudent.name || (formData.get('studentName') || '').toString().trim(),
      registerNumber: currentStudent.registerNumber || (formData.get('registerNumber') || '').toString().trim(),
      department: currentStudent.department || (formData.get('department') || '').toString().trim(),
      year: currentStudent.year || (formData.get('year') || '').toString().trim(),
      computerId: (formData.get('computerId') || selectedComputerId || '').toString().trim(),
      bookedDate: (formData.get('bookedDate') || '').toString().trim(),
      startTime: (formData.get('startTime') || '').toString().trim(),
      endTime: (formData.get('endTime') || '').toString().trim()
    };

    if (!payload.studentName || !payload.registerNumber || !payload.department || !payload.year || !payload.computerId || !payload.bookedDate || !payload.startTime || !payload.endTime) {
      formError.textContent = 'Please complete all required fields before submitting your lab session.';
      formError.classList.remove('hidden');
      SmartLabUtils.showToast('Please complete all required fields.', 'error');
      return;
    }

    const state = await SmartLabData.loadState(true);
    const computer = (state.computers || []).find((pc) => pc.id === payload.computerId);
    if (!computer) {
      formError.textContent = 'Please choose a valid computer from the available workstation list.';
      formError.classList.remove('hidden');
      return;
    }

    if (computer.status !== 'AVAILABLE') {
      formError.textContent = `Workstation ${payload.computerId} is currently ${computer.status}. Please select an Available machine.`;
      formError.classList.remove('hidden');
      return;
    }

    if (SmartLabUtils.parseTimeToMinutes(payload.endTime) <= SmartLabUtils.parseTimeToMinutes(payload.startTime)) {
      formError.textContent = 'End time must be later than start time.';
      formError.classList.remove('hidden');
      return;
    }

    const submitBtn = document.getElementById('submit-record-btn');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Recording in Database...';
    }

    try {
      formError.classList.add('hidden');
      const record = await SmartLabData.addUsageRecord(payload);
      showSummary(record);
      setActivePanel('success');
      SmartLabUtils.showToast(`Session started! Workstation ${payload.computerId} is now In Use.`, 'success');

      // Update telemetry immediately!
      await populateTelemetryAndGrid(true);
    } catch (err) {
      formError.textContent = err.message || 'Failed to submit usage record to database.';
      formError.classList.remove('hidden');
      SmartLabUtils.showToast('Error recording usage.', 'error');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Confirm & Submit Record to DB';
      }
    }
  });

  // Subscribe to real-time live telemetry updates
  SmartLabData.subscribeTelemetry(async () => {
    if (currentStudent && welcomePanel && welcomePanel.classList.contains('active')) {
      await populateTelemetryAndGrid(true);
    }
  });

  // Background auto-refresh telemetry every 6s on welcome panel (only when authenticated)
  setInterval(async () => {
    if (currentStudent && welcomePanel && welcomePanel.classList.contains('active')) {
      try {
        await SmartLabData.autoReleaseExpiredComputers();
      } catch (e) { }
      await populateTelemetryAndGrid(true);
    }
  }, 6000);

  // Initialize
  setDefaultTimes();
  currentStudent = getStoredStudent();
  if (currentStudent) {
    updateStudentHeader(currentStudent);
    prefillStudentFields(currentStudent);
    await populateTelemetryAndGrid(true);
    setActivePanel('welcome');
  } else {
    updateStudentHeader(null);
    setActivePanel('login');
  }
  await hydrateEnrolledStudentsDatalist();
});
