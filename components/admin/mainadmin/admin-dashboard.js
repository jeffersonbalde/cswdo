 class AdminDashboard extends HTMLElement {
            constructor() {
                super();
                this.attachShadow({ mode: "open" });
                this.charts = []; // Array to store multiple Chart.js instances
                this.chartConfigs = [
                    {
                        id: 'chart1',
                        title: 'Child and Youth Welfare Overview',
                        labels: ["January", "February", "March", "April", "May"],
                        values: [12, 19, 3, 5, 2],
                        datasetLabel: 'Youth Cases',
                        backgroundColor: [
                            'rgba(255, 99, 132, 0.6)',
                            'rgba(54, 162, 235, 0.6)',
                            'rgba(255, 206, 86, 0.6)',
                            'rgba(75, 192, 192, 0.6)',
                            'rgba(153, 102, 255, 0.6)'
                        ]
                    },
                    {
                        id: 'chart2',
                        title: 'Service Requests by Category',
                        labels: ["Health", "Education", "Legal", "Social", "Emergency"],
                        values: [45, 32, 18, 28, 15],
                        datasetLabel: 'Service Requests',
                        backgroundColor: [
                            'rgba(75, 192, 192, 0.6)',
                            'rgba(255, 206, 86, 0.6)',
                            'rgba(255, 99, 132, 0.6)',
                            'rgba(54, 162, 235, 0.6)',
                            'rgba(153, 102, 255, 0.6)'
                        ]
                    },
                    {
                        id: 'chart3',
                        title: 'Monthly User Engagement',
                        labels: ["Week 1", "Week 2", "Week 3", "Week 4"],
                        values: [120, 150, 180, 200],
                        datasetLabel: 'Active Users',
                        backgroundColor: [
                            'rgba(153, 102, 255, 0.6)',
                            'rgba(255, 159, 64, 0.6)',
                            'rgba(255, 99, 132, 0.6)',
                            'rgba(54, 162, 235, 0.6)'
                        ]
                    },
                    {
                        id: 'chart4',
                        title: 'Feedback Ratings Distribution',
                        labels: ["Excellent", "Good", "Average", "Poor", "Very Poor"],
                        values: [85, 45, 20, 8, 2],
                        datasetLabel: 'Feedback Count',
                        backgroundColor: [
                            'rgba(34, 197, 94, 0.6)',
                            'rgba(59, 130, 246, 0.6)',
                            'rgba(251, 191, 36, 0.6)',
                            'rgba(239, 68, 68, 0.6)',
                            'rgba(107, 114, 128, 0.6)'
                        ]
                    }
                ];
            }

            connectedCallback() {
                this.render();
                this.loadChartJS(() => this.initializeAllCharts());
            }

            loadChartJS(callback) {
                if (window.Chart) {
                    callback();
                    return;
                }
                const script = document.createElement("script");
                script.src = "https://cdn.jsdelivr.net/npm/chart.js";
                script.onload = callback;
                this.shadowRoot.appendChild(script);
            }

            initializeAllCharts() {
                this.chartConfigs.forEach((config, index) => {
                    this.initializeChart(config, index);
                });
            }

            initializeChart(config, index) {
                const ctx = this.shadowRoot.getElementById(`chartCanvas-${config.id}`).getContext("2d");
                const chartTypeSelect = this.shadowRoot.getElementById(`chartType-${config.id}`);
                
                const data = {
                    labels: config.labels,
                    datasets: [{
                        label: config.datasetLabel,
                        data: config.values,
                        backgroundColor: config.backgroundColor,
                        borderWidth: 1
                    }]
                };

                const createChart = (type) => {
                    if (this.charts[index]) {
                        this.charts[index].destroy();
                    }
                    this.charts[index] = new Chart(ctx, {
                        type: type,
                        data: data,
                        options: {
                            responsive: true,
                            plugins: {
                                legend: {
                                    position: 'top'
                                },
                                title: {
                                    display: true,
                                    text: config.title
                                }
                            }
                        }
                    });
                };

                // Initial chart
                createChart(chartTypeSelect.value);

                // On change
                chartTypeSelect.addEventListener("change", () => {
                    createChart(chartTypeSelect.value);
                });
            }

            generateChartSection(config) {
                return `
                    <div class="chart-section">
                        <h2 class="chart-title">${config.title}</h2>
                        <div class="chart-controls">
                            <label for="chartType-${config.id}">Chart Type:</label>
                            <select id="chartType-${config.id}">
                                <option value="bar">Bar</option>
                                <option value="line">Line</option>
                                <option value="pie">Pie</option>
                                <option value="doughnut">Doughnut</option>
                                <option value="radar">Radar</option>
                                <option value="polarArea">Polar Area</option>
                            </select>
                        </div>
                        <canvas id="chartCanvas-${config.id}" width="600" height="300"></canvas>
                    </div>
                `;
            }

            render() {
                const chartSections = this.chartConfigs.map(config => this.generateChartSection(config)).join('');
                
                this.shadowRoot.innerHTML = `
                    <style>
                        :host {
                            display: block;
                            width: 100%;
                            height: 100%;
                        }
                        .dashboard-content {
                            padding: 30px;
                            height: 100%;
                            overflow-y: auto;
                        }
                        .stats-grid {
                            display: grid;
                            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                            gap: 20px;
                            margin-bottom: 30px;
                        }
                        .stat-card {
                            background: white;
                            border-radius: 8px;
                            padding: 20px;
                            text-align: center;
                            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                            border: 2px solid transparent;
                            transition: transform 0.2s ease;
                        }
                        .stat-card:hover {
                            transform: translateY(-2px);
                        }
                        .stat-card.services { border-color: #f59e0b; }
                        .stat-card.ordinances { border-color: #10b981; }
                        .stat-card.news { border-color: #3b82f6; }
                        .stat-card.stories { border-color: #ef4444; }
                        .stat-card.feedbacks { border-color: #8b5cf6; }
                        .stat-card.users { border-color: #6b7280; }
                        .stat-number {
                            font-size: 36px;
                            font-weight: bold;
                            margin: 10px 0;
                            color: #333;
                        }
                        .stat-label {
                            font-size: 14px;
                            color: #666;
                            font-weight: 500;
                        }
                        .chart-section {
                            background: white;
                            border-radius: 8px;
                            padding: 30px;
                            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                            margin-top: 20px;
                        }
                        .chart-title {
                            text-align: center;
                            font-size: 24px;
                            font-weight: bold;
                            margin-bottom: 10px;
                            color: #333;
                        }
                        .chart-controls {
                            text-align: center;
                            margin-bottom: 20px;
                        }
                        select {
                            padding: 8px 12px;
                            font-size: 16px;
                            border: 1px solid #ddd;
                            border-radius: 4px;
                            background: white;
                        }
                        canvas {
                            display: block;
                            margin: auto;
                            max-width: 100%;
                            height: auto;
                        }
                        label {
                            margin-right: 10px;
                            font-weight: 500;
                            color: #333;
                        }
                    </style>
                    <div class="dashboard-content">
                        <div class="stats-grid">
                            <div class="stat-card services">
                                <div class="stat-label">🔧 Services</div>
                                <div class="stat-number">25</div>
                            </div>
                            <div class="stat-card ordinances">
                                <div class="stat-label">📋 Ordinances</div>
                                <div class="stat-number">25</div>
                            </div>
                            <div class="stat-card news">
                                <div class="stat-label">📰 News & Updates</div>
                                <div class="stat-number">25</div>
                            </div>
                            <div class="stat-card stories">
                                <div class="stat-label">📖 Featured Stories</div>
                                <div class="stat-number">25</div>
                            </div>
                            <div class="stat-card feedbacks">
                                <div class="stat-label">💬 Feedbacks</div>
                                <div class="stat-number">25</div>
                            </div>
                            <div class="stat-card users">
                                <div class="stat-label">👥 Users</div>
                                <div class="stat-number">25</div>
                            </div>
                        </div>
                        ${chartSections}
                    </div>
                `;
            }
        }

        customElements.define("admin-dashboard", AdminDashboard);