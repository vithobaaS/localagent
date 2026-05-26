document.addEventListener('DOMContentLoaded', () => {
    
    // Core Application State
    const state = {
        currentView: 'dashboard',
        executions: [],
        schedulers: [],
        groups: []
    };

    // DOM Elements
    const navItems = document.querySelectorAll('.nav-item');
    const pageViews = document.querySelectorAll('.page-view');
    const stubView = document.getElementById('view-stub');
    const stubTitle = document.getElementById('stubTitle');
    const stubBreadcrumbs = document.getElementById('stubBreadcrumbs');

    // API Base URL
    const API_BASE = '/api';

    // -------------------------------------------------------------
    // SPA ROUTING / VIEW SWITCHING
    // -------------------------------------------------------------
    function switchView(viewId, isStub = false, customTitle = '', customBreadcrumb = '') {
        // Remove active class from nav items
        navItems.forEach(item => item.classList.remove('active'));
        
        // Hide all views
        pageViews.forEach(view => view.classList.remove('active'));
        stubView.classList.remove('active');

        // Set active view in sidebar
        const activeNav = document.querySelector(`.nav-item[data-view="${viewId}"]`);
        if (activeNav) {
            activeNav.classList.add('active');
        }

        if (isStub) {
            stubTitle.textContent = customTitle;
            stubBreadcrumbs.textContent = customBreadcrumb;
            stubView.classList.add('active');
        } else {
            const targetView = document.getElementById(`view-${viewId}`);
            if (targetView) {
                targetView.classList.add('active');
                loadViewData(viewId);
            }
        }
        state.currentView = viewId;
    }

    // Set up click handlers on navigation items
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const viewId = item.getAttribute('data-view');
            
            // Check if it's a stub view (not fully implemented in backend yet)
            if (viewId === 'create-test-suite') {
                switchView('create-test-suite', true, 'Create Test Suite', 'Home > Create Test Suite');
            } else if (viewId === 'list-test-suite') {
                switchView('list-test-suite', true, 'Test Suite List', 'Home > Test Suite List');
            } else if (viewId === 'create-test-case') {
                switchView('create-test-case', true, 'Create Test Case', 'Home > Create Test Case');
            } else if (viewId === 'list-test-case') {
                switchView('list-test-case', true, 'Test Case List', 'Home > Test Case List');
            } else {
                switchView(viewId);
            }
        });
    });

    // Toggle Sidebar Menu
    const menuToggleBtn = document.getElementById('menuToggleBtn');
    const sidebar = document.querySelector('.sidebar');
    if (menuToggleBtn && sidebar) {
        menuToggleBtn.addEventListener('click', () => {
            if (sidebar.style.display === 'none') {
                sidebar.style.display = 'flex';
            } else {
                sidebar.style.display = 'none';
            }
        });
    }

    // -------------------------------------------------------------
    // DATA FETCHING & RENDERING
    // -------------------------------------------------------------
    function loadViewData(viewId) {
        if (viewId === 'dashboard') {
            fetchExecutions();
        } else if (viewId === 'list-scheduler') {
            fetchSchedulers();
        } else if (viewId === 'list-groups') {
            fetchGroups();
        }
    }

    // --- DASHBOARD (EXECUTIONS) ---
    const executionsTableBody = document.querySelector('#executionsTable tbody');
    const dashboardSearchInput = document.getElementById('dashboardSearchInput');
    const dashboardEntriesSelect = document.getElementById('dashboardEntriesSelect');

    function fetchExecutions() {
        renderLoading(executionsTableBody, 6);
        fetch(`${API_BASE}/executions`)
            .then(res => res.json())
            .then(data => {
                state.executions = data;
                renderExecutions();
            })
            .catch(err => {
                console.error("Error fetching executions", err);
                renderError(executionsTableBody, 6, "Failed to load executions. Is the server running?");
            });
    }

    function renderExecutions() {
        let filtered = [...state.executions];
        const search = dashboardSearchInput.value.toLowerCase().trim();
        if (search) {
            filtered = filtered.filter(exec => {
                const name = getTestSuiteName(exec).toLowerCase();
                const status = exec.status.toLowerCase();
                const id = exec.id.toString();
                return name.includes(search) || status.includes(search) || id.includes(search);
            });
        }

        const limit = parseInt(dashboardEntriesSelect.value);
        const displayList = filtered.slice(0, limit);

        if (displayList.length === 0) {
            renderEmpty(executionsTableBody, 6, "No executions found.");
            document.getElementById('dashboardPaginationInfo').textContent = "Showing 0 to 0 of 0 entries";
            return;
        }

        executionsTableBody.innerHTML = '';
        displayList.forEach(exec => {
            const tr = document.createElement('tr');
            
            const suiteName = getTestSuiteName(exec);
            const browserType = getBrowserType(exec);
            const formattedTime = formatTimestamp(exec.createdAt);
            const statusClass = exec.status.toLowerCase();

            tr.innerHTML = `
                <td><strong>${exec.id}</strong></td>
                <td>${suiteName}</td>
                <td><span class="browser-icon">${browserType === 'chrome' ? '🌐' : '🦊'}</span> ${browserType}</td>
                <td>${formattedTime}</td>
                <td><span class="status-badge ${statusClass}">${exec.status}</span></td>
                <td><a class="action-link view-report-link" data-id="${exec.id}">View</a></td>
            `;
            executionsTableBody.appendChild(tr);
        });

        // Set up report modal click listeners
        document.querySelectorAll('.view-report-link').forEach(link => {
            link.addEventListener('click', () => {
                const execId = link.getAttribute('data-id');
                openReportModal(execId);
            });
        });

        document.getElementById('dashboardPaginationInfo').textContent = `Showing 1 to ${displayList.length} of ${filtered.length} entries`;
    }

    // Live search event listeners
    if (dashboardSearchInput) {
        dashboardSearchInput.addEventListener('input', renderExecutions);
    }
    if (dashboardEntriesSelect) {
        dashboardEntriesSelect.addEventListener('change', renderExecutions);
    }

    // --- TEST SCHEDULER ---
    const schedulersTableBody = document.querySelector('#schedulersTable tbody');
    const schedulerEntriesSelect = document.getElementById('schedulerEntriesSelect');

    function fetchSchedulers() {
        renderLoading(schedulersTableBody, 5);
        fetch(`${API_BASE}/schedulers`)
            .then(res => res.json())
            .then(data => {
                state.schedulers = data;
                renderSchedulers();
            })
            .catch(err => {
                console.error("Error fetching schedulers", err);
                renderError(schedulersTableBody, 5, "Failed to load schedulers.");
            });
    }

    function renderSchedulers() {
        const limit = parseInt(schedulerEntriesSelect.value);
        const displayList = state.schedulers.slice(0, limit);

        if (displayList.length === 0) {
            renderEmpty(schedulersTableBody, 5, "No scheduled tests found.");
            return;
        }

        schedulersTableBody.innerHTML = '';
        displayList.forEach(sched => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${sched.testSuiteName}</strong></td>
                <td>${sched.executionType}</td>
                <td><span class="browser-icon">🌐</span> ${sched.browserType}</td>
                <td>-</td>
                <td><span style="font-size:16px; cursor:pointer;" title="View Suite">👁️</span></td>
            `;
            schedulersTableBody.appendChild(tr);
        });
    }

    if (schedulerEntriesSelect) {
        schedulerEntriesSelect.addEventListener('change', renderSchedulers);
    }

    // --- GROUPS ---
    const groupsTableBody = document.querySelector('#groupsTable tbody');
    const groupsSearchInput = document.getElementById('groupsSearchInput');
    const groupEntriesSelect = document.getElementById('groupEntriesSelect');

    function fetchGroups() {
        renderLoading(groupsTableBody, 6);
        fetch(`${API_BASE}/groups`)
            .then(res => res.json())
            .then(data => {
                state.groups = data;
                renderGroups();
            })
            .catch(err => {
                console.error("Error fetching groups", err);
                renderError(groupsTableBody, 6, "Failed to load groups.");
            });
    }

    function renderGroups() {
        let filtered = [...state.groups];
        const search = groupsSearchInput.value.toLowerCase().trim();
        if (search) {
            filtered = filtered.filter(grp => {
                return grp.name.toLowerCase().includes(search) || 
                       (grp.description && grp.description.toLowerCase().includes(search));
            });
        }

        const limit = parseInt(groupEntriesSelect.value);
        const displayList = filtered.slice(0, limit);

        if (displayList.length === 0) {
            renderEmpty(groupsTableBody, 6, "No groups found.");
            return;
        }

        groupsTableBody.innerHTML = '';
        displayList.forEach(grp => {
            const tr = document.createElement('tr');
            const created = formatTimestamp(grp.createdAt);
            tr.innerHTML = `
                <td><strong>${grp.id}</strong></td>
                <td>${grp.name}</td>
                <td>${grp.description || '-'}</td>
                <td>${created}</td>
                <td><span style="font-size:16px; cursor:pointer;" title="View Group">👁️</span></td>
                <td><span style="font-size:16px; cursor:pointer;" title="Map Group">🗺️</span></td>
            `;
            groupsTableBody.appendChild(tr);
        });
    }

    if (groupsSearchInput) {
        groupsSearchInput.addEventListener('input', renderGroups);
    }
    if (groupEntriesSelect) {
        groupEntriesSelect.addEventListener('change', renderGroups);
    }


    // -------------------------------------------------------------
    // FORM SUBMISSIONS
    // -------------------------------------------------------------
    
    // --- CREATE SCHEDULER FORM ---
    const createSchedulerForm = document.getElementById('createSchedulerForm');
    if (createSchedulerForm) {
        createSchedulerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const payload = {
                testSuiteName: document.getElementById('schedTestSuiteName').value,
                executionType: document.getElementById('schedExecutionType').value,
                browserType: document.getElementById('schedBrowser').value,
                status: document.getElementById('schedStatus').value
            };

            fetch(`${API_BASE}/schedulers`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })
            .then(res => {
                if (res.ok) {
                    createSchedulerForm.reset();
                    switchView('list-scheduler');
                } else {
                    alert("Failed to save scheduler. Please check inputs.");
                }
            })
            .catch(err => {
                console.error("Error creating scheduler", err);
                alert("Connection error saving scheduler.");
            });
        });
    }

    // --- CREATE GROUP FORM ---
    const createGroupForm = document.getElementById('createGroupForm');
    if (createGroupForm) {
        createGroupForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const payload = {
                name: document.getElementById('groupName').value,
                description: document.getElementById('groupDesc').value
            };

            fetch(`${API_BASE}/groups`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })
            .then(res => {
                if (res.ok) {
                    createGroupForm.reset();
                    switchView('list-groups');
                } else {
                    alert("Failed to save group.");
                }
            })
            .catch(err => {
                console.error("Error creating group", err);
                alert("Connection error saving group.");
            });
        });
    }


    // -------------------------------------------------------------
    // DETAILS REPORT MODAL
    // -------------------------------------------------------------
    const reportModal = document.getElementById('reportModal');
    const closeModalBtn = document.getElementById('closeModalBtn');
    
    function openReportModal(execId) {
        // Reset modal view
        document.getElementById('metaExecId').textContent = execId;
        document.getElementById('metaExecStatus').className = 'meta-val status-badge';
        document.getElementById('metaExecStatus').textContent = 'Loading...';
        document.getElementById('metaExecStarted').textContent = '-';
        document.getElementById('metaExecFinished').textContent = '-';
        
        const stepsTableBody = document.querySelector('#modalStepsTable tbody');
        renderLoading(stepsTableBody, 6);
        
        reportModal.classList.add('active');

        // Fetch execution detail from UI REST API
        fetch(`${API_BASE}/executions/${execId}`)
            .then(res => res.json())
            .then(data => {
                const exec = data.execution;
                const steps = data.steps;
                const screenshots = data.screenshots;

                // Map UI metadata
                document.getElementById('modalExecutionTitle').textContent = `Execution Report: ${getTestSuiteName(exec)}`;
                
                const statusBadge = document.getElementById('metaExecStatus');
                statusBadge.className = `meta-val status-badge ${exec.status.toLowerCase()}`;
                statusBadge.textContent = exec.status;

                document.getElementById('metaExecStarted').textContent = formatTimestamp(exec.createdAt);
                document.getElementById('metaExecFinished').textContent = exec.finishedAt ? formatTimestamp(exec.finishedAt) : 'In progress...';

                // Map Steps
                if (!steps || steps.length === 0) {
                    renderEmpty(stepsTableBody, 6, "No steps registered for this execution.");
                    return;
                }

                stepsTableBody.innerHTML = '';
                steps.forEach((step, idx) => {
                    const tr = document.createElement('tr');
                    
                    const isExecuted = step.executedStatus === 1 ? "✅ Yes" : "❌ No";
                    
                    let resultBadge = '-';
                    if (step.executedStatus === 1) {
                        resultBadge = step.resultStatus === 1 
                            ? '<span class="status-badge success">PASS</span>'
                            : '<span class="status-badge failed">FAIL</span>';
                    }

                    // Find corresponding screenshot in execution
                    const matchingScreenshot = screenshots.find(sc => sc.stepResultId === step.id);
                    let screenshotCell = '-';
                    if (matchingScreenshot) {
                        const imageSrc = `${API_BASE}/screenshots/${matchingScreenshot.fileName}`;
                        screenshotCell = `<img src="${imageSrc}" class="screenshot-thumb" alt="Step Screenshot">`;
                    }

                    tr.innerHTML = `
                        <td><strong>${step.stepIndex}</strong></td>
                        <td><span style="font-family:monospace; background:#f1f5f9; padding:2px 6px; border-radius:4px;">${step.actionName}</span></td>
                        <td>${isExecuted}</td>
                        <td>${resultBadge}</td>
                        <td><span style="font-size:11px; color:#475569;">${step.errorJson || 'No errors'}</span></td>
                        <td>${screenshotCell}</td>
                    `;
                    stepsTableBody.appendChild(tr);
                });

                // Attach screenshot lightbox clicks
                document.querySelectorAll('.screenshot-thumb').forEach(img => {
                    img.addEventListener('click', () => {
                        openLightbox(img.src);
                    });
                });
            })
            .catch(err => {
                console.error("Error loading execution details", err);
                renderError(stepsTableBody, 6, "Failed to load execution details.");
            });
    }

    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => {
            reportModal.classList.remove('active');
        });
    }

    // Close modal if clicking overlay
    window.addEventListener('click', (e) => {
        if (e.target === reportModal) {
            reportModal.classList.remove('active');
        }
    });

    // --- SCREENSHOT LIGHTBOX ---
    const imageLightbox = document.getElementById('imageLightbox');
    const lightboxImg = document.getElementById('lightboxImg');
    const closeLightboxBtn = document.getElementById('closeLightboxBtn');

    function openLightbox(src) {
        lightboxImg.src = src;
        imageLightbox.classList.add('active');
    }

    if (closeLightboxBtn) {
        closeLightboxBtn.addEventListener('click', () => {
            imageLightbox.classList.remove('active');
        });
    }
    
    if (imageLightbox) {
        imageLightbox.addEventListener('click', (e) => {
            if (e.target !== lightboxImg) {
                imageLightbox.classList.remove('active');
            }
        });
    }


    // -------------------------------------------------------------
    // HELPER FUNCTIONS
    // -------------------------------------------------------------
    function renderLoading(tableBody, colspan) {
        tableBody.innerHTML = `<tr class="loading-row"><td colspan="${colspan}">Loading data...</td></tr>`;
    }

    function renderEmpty(tableBody, colspan, message) {
        tableBody.innerHTML = `<tr class="empty-row"><td colspan="${colspan}">${message}</td></tr>`;
    }

    function renderError(tableBody, colspan, message) {
        tableBody.innerHTML = `<tr class="empty-row"><td colspan="${colspan}" style="color:var(--danger);">${message}</td></tr>`;
    }

    function formatTimestamp(isoStr) {
        if (!isoStr) return '-';
        try {
            const date = new Date(isoStr);
            if (isNaN(date.getTime())) return isoStr;
            return date.getFullYear() + '-' + 
                   String(date.getMonth() + 1).padStart(2, '0') + '-' + 
                   String(date.getDate()).padStart(2, '0') + ' ' + 
                   String(date.getHours()).padStart(2, '0') + ':' + 
                   String(date.getMinutes()).padStart(2, '0') + ':' + 
                   String(date.getSeconds()).padStart(2, '0');
        } catch(e) {
            return isoStr;
        }
    }

    function getTestSuiteName(exec) {
        if (exec.environmentJson) {
            try {
                const parsed = JSON.parse(exec.environmentJson);
                if (parsed.referenceId) return parsed.referenceId;
            } catch(e) {}
        }
        return 'Execution Run #' + exec.id;
    }

    function getBrowserType(exec) {
        if (exec.environmentJson) {
            try {
                const parsed = JSON.parse(exec.environmentJson);
                if (parsed.browserTypeName) return parsed.browserTypeName.toLowerCase();
            } catch(e) {}
        }
        return 'chrome';
    }

    // Initialize Dashboard data on load
    fetchExecutions();
});
