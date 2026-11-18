const SmartLabData = (() => {
  const STORAGE_KEY = 'smartlab-monitor-state-v2';
  const BROADCAST_KEY = 'smartlab-telemetry-sync';

  // Broadcast channel for real-time cross-tab synchronization
  let broadcastChannel = null;
  try {
    if (typeof BroadcastChannel !== 'undefined') {
      broadcastChannel = new BroadcastChannel('smartlab-live-channel');
    }
  } catch (e) {
    // fallback to storage events
  }

  const telemetryListeners = new Set();

  function notifyListeners(detail) {
    telemetryListeners.forEach((fn) => {
      try {
        fn(detail);
      } catch (err) {
        console.error('Telemetry listener error:', err);
      }
    });
  }

  if (broadcastChannel) {
    broadcastChannel.onmessage = (event) => {
      notifyListeners(event.data);
    };
  }

  window.addEventListener('storage', (event) => {
    if (event.key === BROADCAST_KEY && event.newValue) {
      try {
        const parsed = JSON.parse(event.newValue);
        notifyListeners(parsed);
      } catch (e) {
        // ignore parse error
      }
    }
  });

  function broadcastUpdate(type, data = {}) {
    const payload = { type, data, timestamp: Date.now() };
    if (broadcastChannel) {
      try {
        broadcastChannel.postMessage(payload);
      } catch (e) {
        // broadcast failed
      }
    }
    try {
      localStorage.setItem(BROADCAST_KEY, JSON.stringify(payload));
    } catch (e) {
      // localstorage error
    }
    notifyListeners(payload);
  }

  function subscribeTelemetry(callback) {
    telemetryListeners.add(callback);
    return () => telemetryListeners.delete(callback);
  }

  const defaultComputers = Array.from({ length: 60 }, (_, index) => {
    const pcNumber = index + 1;
    const pcId = `LAB-PC-${String(pcNumber).padStart(2, '0')}`;
    return {
      id: pcId,
      label: pcId,
      status: 'AVAILABLE',
      studentName: '',
      lastSeen: new Date().toISOString().slice(0, 16),
      department: '',
      currentBooking: null
    };
  });

  const defaultStaff = [
    { id: 1, staffId: 'STF-101', name: 'Dr. R. Ramanathan', department: 'CSE', designation: 'Lab Incharge & Professor', email: 'ramanathan@smartlab.edu', phone: '+91 98765 43210', assignedLab: 'Innovation Lab 01' },
    { id: 2, staffId: 'STF-102', name: 'Prof. S. Malathy', department: 'AI & DS', designation: 'Assistant Professor', email: 'malathy.s@smartlab.edu', phone: '+91 98765 43211', assignedLab: 'AI & Robotics Lab' },
    { id: 3, staffId: 'STF-103', name: 'Er. Vigneshwaran K', department: 'ECE', designation: 'System Administrator', email: 'vignesh.admin@smartlab.edu', phone: '+91 98765 43212', assignedLab: 'Innovation Lab 01' },
    { id: 4, staffId: 'STF-104', name: 'Dr. Anitha George', department: 'EEE', designation: 'Associate Professor', email: 'anitha.g@smartlab.edu', phone: '+91 98765 43213', assignedLab: 'IoT & Embedded Lab' },
    { id: 5, staffId: 'STF-105', name: 'Er. Praveen Kumar', department: 'MECH', designation: 'Lab Technician', email: 'praveen.k@smartlab.edu', phone: '+91 98765 43214', assignedLab: 'CAD / CAM Lab' }
  ];

  const defaultStudents = [
    { id: 1, name: 'AAMINA THASIN', dob: '2007-08-22', registerNumber: '732924ADR001', department: 'AI & DS', year: '2nd Year' },
    { id: 2, name: 'ABISHEK', dob: '2007-02-24', registerNumber: '732924ADR002', department: 'AI & DS', year: '2nd Year' },
    { id: 3, name: 'AJITHKUMAR', dob: '2006-10-10', registerNumber: '732924ADR003', department: 'AI & DS', year: '2nd Year' },
    { id: 4, name: 'AKSHARA BHARATHI', dob: '2006-09-28', registerNumber: '732924ADR004', department: 'AI & DS', year: '2nd Year' },
    { id: 5, name: 'ANAND', dob: '2005-11-16', registerNumber: '732924ADR005', department: 'AI & DS', year: '2nd Year' },
    { id: 6, name: 'ANBULINGAM', dob: '2007-10-05', registerNumber: '732924ADR006', department: 'AI & DS', year: '2nd Year' },
    { id: 7, name: 'ANCHANA', dob: '2006-11-15', registerNumber: '732924ADR007', department: 'AI & DS', year: '2nd Year' },
    { id: 8, name: 'ANISHA', dob: '2006-11-10', registerNumber: '732924ADR008', department: 'AI & DS', year: '2nd Year' },
    { id: 9, name: 'ANUSHUYA DEVI', dob: '2006-10-10', registerNumber: '732924ADR009', department: 'AI & DS', year: '2nd Year' },
    { id: 10, name: 'ARUNA', dob: '2006-08-26', registerNumber: '732924ADR010', department: 'AI & DS', year: '2nd Year' },
    { id: 11, name: 'ATHIKESAVAN', dob: '2007-02-06', registerNumber: '732924ADR011', department: 'AI & DS', year: '2nd Year' },
    { id: 12, name: 'BHARANITHARAN', dob: '', registerNumber: '732924ADR012', department: 'AI & DS', year: '2nd Year' },
    { id: 13, name: 'DEEPAK', dob: '2006-12-12', registerNumber: '732924ADR013', department: 'AI & DS', year: '2nd Year' },
    { id: 14, name: 'DEEPIKA', dob: '2006-12-17', registerNumber: '732924ADR014', department: 'AI & DS', year: '2nd Year' },
    { id: 15, name: 'DHARANEESH', dob: '2007-07-28', registerNumber: '732924ADR015', department: 'AI & DS', year: '2nd Year' },
    { id: 16, name: 'DHARANESH', dob: '2007-02-19', registerNumber: '732924ADR016', department: 'AI & DS', year: '2nd Year' },
    { id: 17, name: 'DHARANIKAA', dob: '2007-01-14', registerNumber: '732924ADR017', department: 'AI & DS', year: '2nd Year' },
    { id: 18, name: 'DHARASHIN KUMAR', dob: '2007-06-04', registerNumber: '732924ADR018', department: 'AI & DS', year: '2nd Year' },
    { id: 19, name: 'DHARSHINI', dob: '2006-06-13', registerNumber: '732924ADR019', department: 'AI & DS', year: '2nd Year' },
    { id: 20, name: 'DHARSHINI', dob: '2007-07-28', registerNumber: '732924ADR020', department: 'AI & DS', year: '2nd Year' },
    { id: 21, name: 'DHARSHINI', dob: '2007-04-04', registerNumber: '732924ADR021', department: 'AI & DS', year: '2nd Year' },
    { id: 22, name: 'DHARUN', dob: '2006-05-17', registerNumber: '732924ADR022', department: 'AI & DS', year: '2nd Year' },
    { id: 23, name: 'DHARUN', dob: '2006-11-19', registerNumber: '732924ADR023', department: 'AI & DS', year: '2nd Year' },
    { id: 24, name: 'DINESH KUMAR', dob: '2005-08-21', registerNumber: '732924ADR024', department: 'AI & DS', year: '2nd Year' },
    { id: 25, name: 'ENIYAN', dob: '2006-09-12', registerNumber: '732924ADR025', department: 'AI & DS', year: '2nd Year' },
    { id: 26, name: 'ETHIKASH', dob: '2007-04-08', registerNumber: '732924ADR026', department: 'AI & DS', year: '2nd Year' },
    { id: 27, name: 'GAYATHRI', dob: '2006-08-10', registerNumber: '732924ADR027', department: 'AI & DS', year: '2nd Year' },
    { id: 28, name: 'GIRIDHARAN', dob: '2007-05-11', registerNumber: '732924ADR028', department: 'AI & DS', year: '2nd Year' },
    { id: 29, name: 'GOBIKRISHNA', dob: '2007-06-07', registerNumber: '732924ADR029', department: 'AI & DS', year: '2nd Year' },
    { id: 30, name: 'GOPIKA', dob: '2007-07-04', registerNumber: '732924ADR030', department: 'AI & DS', year: '2nd Year' },
    { id: 31, name: 'GOUTHAM SIDDARTH', dob: '2006-09-19', registerNumber: '732924ADR031', department: 'AI & DS', year: '2nd Year' },
    { id: 32, name: 'GOWSHIKA', dob: '2006-09-18', registerNumber: '732924ADR032', department: 'AI & DS', year: '2nd Year' },
    { id: 33, name: 'GOWTHAM KOMBUKKATTUR SHANMUGASUNDARAM', dob: '2007-03-28', registerNumber: '732924ADR033', department: 'AI & DS', year: '2nd Year' },
    { id: 34, name: 'GOWTHAM', dob: '2006-12-09', registerNumber: '732924ADR034', department: 'AI & DS', year: '2nd Year' },
    { id: 35, name: 'GUGAN', dob: '2007-06-06', registerNumber: '732924ADR035', department: 'AI & DS', year: '2nd Year' },
    { id: 36, name: 'HARI AKASH', dob: '2006-08-21', registerNumber: '732924ADR036', department: 'AI & DS', year: '2nd Year' },
    { id: 37, name: 'HARIDASS', dob: '2007-04-24', registerNumber: '732924ADR037', department: 'AI & DS', year: '2nd Year' },
    { id: 38, name: 'HARIHARAMUGUNTHAN', dob: '2007-01-07', registerNumber: '732924ADR038', department: 'AI & DS', year: '2nd Year' },
    { id: 39, name: 'HARINE SHREE', dob: '2006-09-16', registerNumber: '732924ADR039', department: 'AI & DS', year: '2nd Year' },
    { id: 40, name: 'HARINI SRI', dob: '2007-02-01', registerNumber: '732924ADR040', department: 'AI & DS', year: '2nd Year' },
    { id: 41, name: 'HARSHINI', dob: '2006-10-03', registerNumber: '732924ADR041', department: 'AI & DS', year: '2nd Year' },
    { id: 42, name: 'HARSINI', dob: '2007-06-17', registerNumber: '732924ADR042', department: 'AI & DS', year: '2nd Year' },
    { id: 43, name: 'HEMALATHA', dob: '2006-05-31', registerNumber: '732924ADR043', department: 'AI & DS', year: '2nd Year' },
    { id: 44, name: 'INDHIRAN', dob: '2006-06-21', registerNumber: '732924ADR044', department: 'AI & DS', year: '2nd Year' },
    { id: 45, name: 'JAIAKASH', dob: '2006-05-18', registerNumber: '732924ADR045', department: 'AI & DS', year: '2nd Year' },
    { id: 46, name: 'JANADHARSHINI', dob: '2006-12-23', registerNumber: '732924ADR046', department: 'AI & DS', year: '2nd Year' },
    { id: 47, name: 'JANANI', dob: '2007-08-25', registerNumber: '732924ADR047', department: 'AI & DS', year: '2nd Year' },
    { id: 48, name: 'JAYANITHYAN', dob: '2006-12-24', registerNumber: '732924ADR048', department: 'AI & DS', year: '2nd Year' },
    { id: 49, name: 'JAYAPRIYA', dob: '2006-11-16', registerNumber: '732924ADR049', department: 'AI & DS', year: '2nd Year' },
    { id: 50, name: 'JIVITESH', dob: '2007-04-11', registerNumber: '732924ADR050', department: 'AI & DS', year: '2nd Year' },
    { id: 51, name: 'KAMALESHWARAN', dob: '2006-11-08', registerNumber: '732924ADR051', department: 'AI & DS', year: '2nd Year' },
    { id: 52, name: 'KANIKA', dob: '2007-03-17', registerNumber: '732924ADR052', department: 'AI & DS', year: '2nd Year' },
    { id: 53, name: 'KARTHICK', dob: '2006-08-09', registerNumber: '732924ADR053', department: 'AI & DS', year: '2nd Year' },
    { id: 54, name: 'KARTHIKA', dob: '2006-12-06', registerNumber: '732924ADR054', department: 'AI & DS', year: '2nd Year' },
    { id: 55, name: 'KARTHIKEYAN', dob: '2007-02-17', registerNumber: '732924ADR055', department: 'AI & DS', year: '2nd Year' },
    { id: 56, name: 'KAVIYA', dob: '2007-02-26', registerNumber: '732924ADR056', department: 'AI & DS', year: '2nd Year' },
    { id: 57, name: 'KIRUTHIKA', dob: '2007-10-25', registerNumber: '732924ADR057', department: 'AI & DS', year: '2nd Year' },
    { id: 58, name: 'LAILATHUL RASMIN', dob: '2006-10-20', registerNumber: '732924ADR058', department: 'AI & DS', year: '2nd Year' },
    { id: 59, name: 'LALITH', dob: '2006-12-06', registerNumber: '732924ADR059', department: 'AI & DS', year: '2nd Year' }
  ];

  const defaultRecords = [];

  function generateInitialState() {
    return {
      computers: defaultComputers,
      staff: defaultStaff,
      students: defaultStudents,
      records: defaultRecords,
      settings: { autoApprove: true, conflictDetection: true, autoRelease: true }
    };
  }

  function checkAndAutoReleaseExpired(state) {
    if (!state || !Array.isArray(state.computers)) return [];
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const releasedPcIds = [];
    let stateChanged = false;

    // 1. Check Usage Records
    if (Array.isArray(state.records)) {
      state.records.forEach((rec) => {
        if (rec.status === 'IN_USE') {
          const recDate = String(rec.bookedDate || '').trim();
          const recEnd = String(rec.endTime || '').trim();
          let expired = false;

          if (recDate) {
            if (recDate < todayStr) {
              expired = true;
            } else if (recDate === todayStr && recEnd) {
              const endMin = SmartLabUtils.parseTimeToMinutes(recEnd);
              if (currentMinutes >= endMin) {
                expired = true;
              }
            }
          } else if (recEnd) {
            const endMin = SmartLabUtils.parseTimeToMinutes(recEnd);
            if (currentMinutes >= endMin) {
              expired = true;
            }
          }

          if (expired) {
            rec.status = 'COMPLETED';
            stateChanged = true;
            if (rec.computerId && !releasedPcIds.includes(rec.computerId)) {
              releasedPcIds.push(rec.computerId);
            }
          }
        }
      });
    }

    // 2. Check Computers
    state.computers.forEach((pc) => {
      if (pc.status === 'IN_USE') {
        let expired = false;
        if (releasedPcIds.includes(pc.id)) {
          expired = true;
        } else if (pc.currentBooking && pc.currentBooking.end) {
          const endMin = SmartLabUtils.parseTimeToMinutes(pc.currentBooking.end);
          if (currentMinutes >= endMin) {
            expired = true;
          }
        } else {
          // No current booking time and no active record
          const hasActive = (state.records || []).some(
            (r) => r.computerId === pc.id && r.status === 'IN_USE'
          );
          if (!hasActive) {
            expired = true;
          }
        }

        if (expired) {
          pc.status = 'AVAILABLE';
          pc.studentName = '';
          pc.department = '';
          pc.currentBooking = null;
          pc.lastSeen = now.toISOString().slice(0, 16);
          if (!releasedPcIds.includes(pc.id)) {
            releasedPcIds.push(pc.id);
          }
          stateChanged = true;
        }
      }
    });

    if (stateChanged) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch (e) {}
      broadcastUpdate('telemetry_updated', {
        autoReleased: true,
        releasedPcIds
      });
    }

    return releasedPcIds;
  }

  function readLocalState() {
    try {
      localStorage.removeItem('smartlab-monitor-state-v1');
    } catch (e) {}

    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = generateInitialState();
      checkAndAutoReleaseExpired(initial);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }

    try {
      const parsed = JSON.parse(raw);
      const state = {
        computers: Array.isArray(parsed.computers) && parsed.computers.length ? parsed.computers : defaultComputers,
        staff: Array.isArray(parsed.staff) && parsed.staff.length ? parsed.staff : defaultStaff,
        students: Array.isArray(parsed.students) && parsed.students.length ? parsed.students : defaultStudents,
        records: Array.isArray(parsed.records) ? parsed.records : [],
        settings: {
          autoApprove: true,
          conflictDetection: true,
          autoRelease: true,
          ...(parsed.settings || {})
        }
      };
      // Sanitize any legacy mock offline computers or fake demo names that have no active session
      (state.computers || []).forEach((c) => {
        if (c.status === 'OFFLINE' || (c.studentName && ['Aisha', 'Arun', 'Nandha', 'Farah', 'Karthik'].includes(c.studentName))) {
          const hasActiveRecord = (state.records || []).some(
            (r) => r.computerId === c.id && r.status === 'IN_USE'
          );
          if (!hasActiveRecord) {
            c.status = 'AVAILABLE';
            c.studentName = '';
            c.department = '';
            c.currentBooking = null;
          }
        }
      });
      checkAndAutoReleaseExpired(state);
      return state;
    } catch (error) {
      const initial = generateInitialState();
      checkAndAutoReleaseExpired(initial);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
  }

  function saveState(state) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      // storage error
    }
  }

  async function fetchJson(url, options = {}) {
    let finalUrl = url;
    if (!options.method || options.method === 'GET') {
      const sep = finalUrl.includes('?') ? '&' : '?';
      finalUrl = `${finalUrl}${sep}_t=${Date.now()}`;
    }

    const headers = { ...options.headers };
    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(finalUrl, {
      ...options,
      headers
    });

    if (!response.ok) {
      let message = 'Request failed';
      try {
        const errJson = await response.json();
        message = errJson.message || message;
      } catch (e) {
        message = await response.text();
      }
      throw new Error(message || 'Request failed');
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return null;
    }

    return response.json();
  }

  async function loadState(forceFresh = false) {
    try {
      const opts = forceFresh ? { cache: 'no-cache' } : {};
      const payload = await fetchJson('/api/state', opts);
      if (payload && payload.computers) {
        checkAndAutoReleaseExpired(payload);
        saveState(payload);
        return payload;
      }
    } catch (error) {
      // fallback to local data
    }
    const local = readLocalState();
    checkAndAutoReleaseExpired(local);
    return local;
  }

  async function autoReleaseExpiredComputers() {
    try {
      const resp = await fetchJson('/api/computers/auto-release', { method: 'POST' });
      if (resp && resp.ok) {
        if (resp.releasedCount > 0) {
          broadcastUpdate('telemetry_updated', {
            autoReleased: true,
            releasedPcIds: resp.releasedComputers
          });
        }
        return resp;
      }
    } catch (e) {
      // fallback
    }

    const state = readLocalState();
    const released = checkAndAutoReleaseExpired(state);
    return { ok: true, releasedCount: released.length, releasedComputers: released };
  }

  async function syncFromDatabase() {
    const state = await loadState(true);
    broadcastUpdate('db_synced', { state });
    return state;
  }

  async function getComputerStatusSummary(forceFresh = false) {
    try {
      const opts = forceFresh ? { cache: 'no-cache' } : {};
      const payload = await fetchJson('/api/summary', opts);
      if (payload) {
        return payload;
      }
    } catch (error) {
      // fallback
    }

    const state = readLocalState();
    checkAndAutoReleaseExpired(state);
    const total = state.computers.length;
    const available = state.computers.filter((pc) => pc.status === 'AVAILABLE').length;
    const inUse = state.computers.filter((pc) => pc.status === 'IN_USE').length;
    const offline = state.computers.filter((pc) => pc.status === 'OFFLINE').length;
    const maintenance = state.computers.filter((pc) => pc.status === 'MAINTENANCE').length;
    return {
      total,
      available,
      inUse,
      offline,
      maintenance,
      occupancyPct: total > 0 ? Number(((inUse / total) * 100).toFixed(1)) : 0,
      availablePct: total > 0 ? Number(((available / total) * 100).toFixed(1)) : 0,
      totalStaff: (state.staff || []).length,
      recentRecords: (state.records || []).slice(0, 10),
      lastUpdated: new Date().toISOString()
    };
  }

  async function getAvailableComputer() {
    const state = await loadState();
    const available = (state.computers || []).find((pc) => pc.status === 'AVAILABLE');
    return available ? available.id : null;
  }

  /* Staff API */
  async function getStaff() {
    try {
      const staffList = await fetchJson('/api/staff');
      if (Array.isArray(staffList)) {
        const state = readLocalState();
        state.staff = staffList;
        saveState(state);
        return staffList;
      }
    } catch (error) {
      // fallback
    }
    const state = readLocalState();
    return state.staff || defaultStaff;
  }

  async function addStaff(payload) {
    try {
      const response = await fetchJson('/api/staff', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      if (response && response.ok) {
        broadcastUpdate('staff_updated', { action: 'add', staff: response.staff });
        return response.staff;
      }
    } catch (error) {
      // fallback to local
    }

    const state = readLocalState();
    const newStaff = {
      id: Date.now(),
      staffId: payload.staffId || `STF-${Date.now().toString().slice(-3)}`,
      name: payload.name,
      department: payload.department,
      designation: payload.designation,
      email: payload.email || '',
      phone: payload.phone || '',
      assignedLab: payload.assignedLab || 'Innovation Lab 01'
    };
    state.staff = state.staff || [];
    state.staff.push(newStaff);
    saveState(state);
    broadcastUpdate('staff_updated', { action: 'add', staff: newStaff });
    return newStaff;
  }

  async function updateStaff(id, payload) {
    try {
      const response = await fetchJson(`/api/staff/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
      if (response && response.ok) {
        broadcastUpdate('staff_updated', { action: 'update', staff: response.staff });
        return response.staff;
      }
    } catch (error) {
      // fallback to local
    }

    const state = readLocalState();
    state.staff = state.staff || [];
    const index = state.staff.findIndex((s) => Number(s.id) === Number(id));
    if (index !== -1) {
      state.staff[index] = { ...state.staff[index], ...payload };
      saveState(state);
      broadcastUpdate('staff_updated', { action: 'update', staff: state.staff[index] });
      return state.staff[index];
    }
    return null;
  }

  async function deleteStaff(id) {
    try {
      const response = await fetchJson(`/api/staff/${id}`, {
        method: 'DELETE'
      });
      if (response && response.ok) {
        broadcastUpdate('staff_updated', { action: 'delete', id });
        return true;
      }
    } catch (error) {
      // fallback to local
    }

    const state = readLocalState();
    state.staff = (state.staff || []).filter((s) => Number(s.id) !== Number(id));
    saveState(state);
    broadcastUpdate('staff_updated', { action: 'delete', id });
    return true;
  }

  /* Computer API */
  async function addComputer(payload) {
    try {
      const response = await fetchJson('/api/computers', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      if (response && response.ok) {
        broadcastUpdate('computer_updated', { action: 'add', computer: response.computer });
        return response.computer;
      }
    } catch (error) {
      // fallback to local
    }

    const state = readLocalState();
    const computer = {
      id: payload.computerId,
      label: payload.computerId,
      status: payload.status || 'AVAILABLE',
      studentName: payload.studentName || '',
      department: payload.department || '',
      lastSeen: new Date().toISOString().slice(0, 16),
      currentBooking: null
    };
    state.computers.push(computer);
    saveState(state);
    broadcastUpdate('computer_updated', { action: 'add', computer });
    return computer;
  }

  async function releaseComputer(computerId) {
    try {
      const response = await fetchJson(`/api/computers/${encodeURIComponent(computerId)}/release`, {
        method: 'POST'
      });
      if (response && response.ok) {
        broadcastUpdate('telemetry_updated', { computerId, status: 'AVAILABLE' });
        return response;
      }
    } catch (error) {
      // fallback
    }

    const state = readLocalState();
    const pc = (state.computers || []).find((c) => c.id === computerId);
    if (pc) {
      pc.status = 'AVAILABLE';
      pc.studentName = '';
      pc.department = '';
      pc.currentBooking = null;
      pc.lastSeen = new Date().toISOString().slice(0, 16);
      saveState(state);
      broadcastUpdate('telemetry_updated', { computerId, status: 'AVAILABLE' });
    }
    return { ok: true };
  }

  async function setComputerStatus(computerId, status) {
    try {
      const response = await fetchJson(`/api/computers/${encodeURIComponent(computerId)}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status })
      });
      if (response && response.ok) {
        broadcastUpdate('telemetry_updated', { computerId, status });
        return response;
      }
    } catch (error) {
      // fallback
    }

    const state = readLocalState();
    const pc = (state.computers || []).find((c) => c.id === computerId);
    if (pc) {
      pc.status = status;
      if (status === 'AVAILABLE') {
        pc.studentName = '';
        pc.department = '';
        pc.currentBooking = null;
      }
      pc.lastSeen = new Date().toISOString().slice(0, 16);
      saveState(state);
      broadcastUpdate('telemetry_updated', { computerId, status });
    }
    return { ok: true };
  }

  /* Usage Record API */
  async function addUsageRecord(payload) {
    let resultRecord = null;
    try {
      const response = await fetchJson('/api/records', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (response && response.record) {
        resultRecord = response.record;
      }
    } catch (error) {
      // fallback to local update
    }

    if (!resultRecord) {
      resultRecord = {
        id: `R-${Date.now()}`,
        ...payload,
        durationHours: SmartLabUtils.timeDifferenceInHours(payload.startTime, payload.endTime),
        status: 'IN_USE',
        createdAt: new Date().toISOString()
      };
    }

    const state = readLocalState();
    state.records = state.records || [];
    state.records.unshift(resultRecord);

    const computer = (state.computers || []).find((pc) => pc.id === payload.computerId);
    if (computer) {
      computer.status = 'IN_USE';
      computer.studentName = payload.studentName;
      computer.department = payload.department;
      computer.lastSeen = new Date().toISOString().slice(0, 16);
      computer.currentBooking = { start: payload.startTime, end: payload.endTime };
    }
    saveState(state);

    // Broadcast live telemetry update across all pages/tabs!
    broadcastUpdate('record_submitted', { record: resultRecord, computerId: payload.computerId });
    return resultRecord;
  }

  function validateNoOverlap(date, computerId, startTime, endTime) {
    const state = readLocalState();
    const sameComputer = (state.records || []).filter(
      (record) => record.computerId === computerId && record.bookedDate === date && record.status === 'IN_USE'
    );
    return sameComputer.every((record) => {
      const existingStart = SmartLabUtils.parseTimeToMinutes(record.startTime);
      const existingEnd = SmartLabUtils.parseTimeToMinutes(record.endTime);
      const newStart = SmartLabUtils.parseTimeToMinutes(startTime);
      const newEnd = SmartLabUtils.parseTimeToMinutes(endTime);
      return newEnd <= existingStart || newStart >= existingEnd;
    });
  }

  async function loginAdmin(username, password) {
    try {
      const payload = await fetchJson('/api/admin/login', {
        method: 'POST',
        body: JSON.stringify({ username, password })
      });
      return payload || { ok: true, message: 'Admin login successful' };
    } catch (error) {
      if (username === 'admin' && password === 'admin123') {
        return { ok: true, message: 'Admin login successful' };
      }
      return { ok: false, message: 'Invalid username or password' };
    }
  }

  async function loginStudent(name, dob) {
    try {
      const payload = await fetchJson('/api/student/login', {
        method: 'POST',
        body: JSON.stringify({ name, dob })
      });
      if (payload && payload.ok) {
        return payload;
      }
    } catch (error) {
      if (error && error.message && error.message !== 'Request failed') {
        throw error;
      }
    }

    const state = readLocalState();
    const cleanName = String(name || '').trim().toUpperCase();
    const cleanDob = String(dob || '').trim().replace(/\//g, '-');

    const matched = (state.students || []).find((s) => {
      const sName = String(s.name || '').trim().toUpperCase();
      const sDob = String(s.dob || '').trim().replace(/\//g, '-');
      if (sName !== cleanName) return false;
      if (!sDob) return true;
      return sDob === cleanDob;
    });

    if (matched) {
      return {
        ok: true,
        student: matched,
        message: `Welcome, ${matched.name}! Student verified successfully.`
      };
    }

    throw new Error('Invalid Student Name or Date of Birth. Access denied.');
  }

  async function getMonthlyReport(month = '') {
    const query = month ? `?month=${encodeURIComponent(month)}` : '';
    try {
      const payload = await fetchJson(`/api/reports/monthly${query}`);
      if (payload) {
        return payload;
      }
    } catch (error) {
      // fallback to local data
    }

    const state = readLocalState();
    const records = month
      ? (state.records || []).filter((record) => record.bookedDate && record.bookedDate.startsWith(month))
      : (state.records || []);

    const totalHours = records.reduce((sum, record) => sum + SmartLabUtils.timeDifferenceInHours(record.startTime, record.endTime), 0);
    const byDepartment = records.reduce((acc, record) => {
      acc[record.department] = (acc[record.department] || 0) + 1;
      return acc;
    }, {});

    return {
      month,
      totalRecords: records.length,
      totalHours: Number(totalHours.toFixed(2)),
      byDepartment,
      records
    };
  }

  async function getDailyReport(day = '') {
    const query = day ? `?day=${encodeURIComponent(day)}` : '';
    try {
      const payload = await fetchJson(`/api/reports/daily${query}`);
      if (payload) {
        return payload;
      }
    } catch (error) {
      // fallback to local data
    }

    const state = readLocalState();
    const targetDay = day || new Date().toISOString().slice(0, 10);
    const records = (state.records || []).filter((r) => r.bookedDate === targetDay);
    const totalHours = records.reduce((sum, r) => sum + SmartLabUtils.timeDifferenceInHours(r.startTime, r.endTime), 0);
    const byDepartment = records.reduce((acc, r) => {
      acc[r.department] = (acc[r.department] || 0) + 1;
      return acc;
    }, {});

    return {
      date: targetDay,
      totalRecords: records.length,
      totalHours: Number(totalHours.toFixed(2)),
      byDepartment,
      records
    };
  }

  /* Alter / Edit Usage Record */
  async function updateUsageRecord(recordId, payload) {
    try {
      const response = await fetchJson(`/api/records/${encodeURIComponent(recordId)}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
      if (response && response.ok) {
        broadcastUpdate('record_submitted', { record: response.record, computerId: response.record.computerId });
        return response.record;
      }
    } catch (error) {
      // fallback to local
    }

    const state = readLocalState();
    state.records = state.records || [];
    const idx = state.records.findIndex((r) => r.id === recordId);
    if (idx !== -1) {
      state.records[idx] = { ...state.records[idx], ...payload };
      const comp = (state.computers || []).find((c) => c.id === state.records[idx].computerId);
      if (comp) {
        comp.status = payload.status || comp.status;
        if (payload.status === 'AVAILABLE') {
          comp.studentName = '';
          comp.department = '';
        } else if (payload.status === 'IN_USE') {
          comp.studentName = payload.studentName || comp.studentName;
          comp.department = payload.department || comp.department;
        }
      }
      saveState(state);
      broadcastUpdate('record_submitted', { record: state.records[idx], computerId: state.records[idx].computerId });
      return state.records[idx];
    }
    return null;
  }

  /* Restart Usage Session */
  async function restartUsageRecord(recordId) {
    try {
      const response = await fetchJson(`/api/records/${encodeURIComponent(recordId)}/restart`, {
        method: 'POST'
      });
      if (response && response.ok) {
        broadcastUpdate('record_submitted', { record: response.record, computerId: response.record.computerId });
        return response.record;
      }
    } catch (error) {
      // fallback
    }

    const state = readLocalState();
    state.records = state.records || [];
    const idx = state.records.findIndex((r) => r.id === recordId);
    if (idx !== -1) {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMin = now.getMinutes();
      const startStr = `${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`;
      const endHour = (currentHour + 1 + Math.floor((currentMin + 30) / 60)) % 24;
      const endMin = (currentMin + 30) % 60;
      const endStr = `${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`;

      state.records[idx].startTime = startStr;
      state.records[idx].endTime = endStr;
      state.records[idx].status = 'IN_USE';
      state.records[idx].bookedDate = now.toISOString().slice(0, 10);

      const comp = (state.computers || []).find((c) => c.id === state.records[idx].computerId);
      if (comp) {
        comp.status = 'IN_USE';
        comp.studentName = state.records[idx].studentName;
        comp.department = state.records[idx].department;
        comp.currentBooking = { start: startStr, end: endStr };
      }
      saveState(state);
      broadcastUpdate('record_submitted', { record: state.records[idx], computerId: state.records[idx].computerId });
      return state.records[idx];
    }
    return null;
  }

  /* Delete Usage Record */
  async function deleteUsageRecord(recordId) {
    try {
      await fetchJson(`/api/records/${encodeURIComponent(recordId)}`, {
        method: 'DELETE'
      });
    } catch (e) {
      // fallback
    }
    const state = readLocalState();
    state.records = (state.records || []).filter((r) => r.id !== recordId);
    saveState(state);
    broadcastUpdate('record_submitted', { recordId, deleted: true });
    return true;
  }

  /* Clear All Usage Records */
  async function clearAllUsageRecords() {
    try {
      await fetchJson('/api/records/clear-all', {
        method: 'POST'
      });
    } catch (e) {
      // fallback
    }
    const state = readLocalState();
    state.records = [];
    // Reset any in-use computers locally if needed
    (state.computers || []).forEach((c) => {
      if (c.status === 'IN_USE') {
        c.status = 'AVAILABLE';
        c.studentName = '';
        c.department = '';
        c.currentBooking = null;
      }
    });
    saveState(state);
    broadcastUpdate('record_submitted', { clearedAll: true });
    return true;
  }

  /* Student Management */
  async function addStudent(studentData) {
    const payload = await fetchJson('/api/students', {
      method: 'POST',
      body: JSON.stringify(studentData)
    });
    await syncFromDatabase();
    return payload;
  }

  async function updateStudent(studentId, studentData) {
    const payload = await fetchJson(`/api/students/${studentId}`, {
      method: 'PUT',
      body: JSON.stringify(studentData)
    });
    await syncFromDatabase();
    return payload;
  }

  async function deleteStudent(studentId) {
    const payload = await fetchJson(`/api/students/${studentId}`, {
      method: 'DELETE'
    });
    await syncFromDatabase();
    return payload;
  }

  /* Change Admin Password */
  async function changeAdminPassword(currentPassword, newPassword) {
    const payload = await fetchJson('/api/admin/change-password', {
      method: 'POST',
      body: JSON.stringify({ current_password: currentPassword, new_password: newPassword })
    });
    return payload;
  }

  /* Student Excel Upload */
  async function uploadStudentExcel(formData) {
    const resp = await fetch('/api/students/upload-excel', {
      method: 'POST',
      body: formData
    });
    const result = await resp.json();
    await syncFromDatabase();
    return result;
  }

  /* Timetable Upload & Fetch */
  async function uploadTimetable(formDataOrBase64) {
    if (formDataOrBase64 instanceof FormData) {
      const resp = await fetch('/api/timetable/upload', {
        method: 'POST',
        body: formDataOrBase64
      });
      return resp.json();
    } else {
      return fetchJson('/api/timetable/upload', {
        method: 'POST',
        body: JSON.stringify({ image_data: formDataOrBase64 })
      });
    }
  }

  async function getTimetable() {
    try {
      const data = await fetchJson('/api/timetable');
      return data;
    } catch (e) {
      return { ok: false, has_image: false };
    }
  }

  /* Timetable Schedule API */
  async function getTimetableSchedule() {
    try {
      const data = await fetchJson('/api/timetable/schedule');
      return data;
    } catch (e) {
      return { ok: false, schedule: null };
    }
  }

  async function saveTimetableSchedule(schedule) {
    return fetchJson('/api/timetable/schedule', {
      method: 'POST',
      body: JSON.stringify({ schedule })
    });
  }

  async function resetTimetableSchedule() {
    return fetchJson('/api/timetable/schedule/reset', {
      method: 'POST'
    });
  }

  return {
    STORAGE_KEY,
    generateInitialState,
    loadState,
    saveState,
    syncFromDatabase,
    broadcastUpdate,
    subscribeTelemetry,
    getAvailableComputer,
    getStaff,
    addStaff,
    updateStaff,
    deleteStaff,
    addComputer,
    releaseComputer,
    autoReleaseExpiredComputers,
    checkAndAutoReleaseExpired,
    setComputerStatus,
    addUsageRecord,
    updateUsageRecord,
    restartUsageRecord,
    deleteUsageRecord,
    clearAllUsageRecords,
    addStudent,
    updateStudent,
    deleteStudent,
    uploadStudentExcel,
    validateNoOverlap,
    getComputerStatusSummary,
    loginAdmin,
    loginStudent,
    changeAdminPassword,
    getMonthlyReport,
    getDailyReport,
    uploadTimetable,
    getTimetable,
    getTimetableSchedule,
    saveTimetableSchedule,
    resetTimetableSchedule
  };
})();

