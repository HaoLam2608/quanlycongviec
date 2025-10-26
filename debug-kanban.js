(async () => {
  try {
    const db = require('./models');
    const taskController = require('./controllers/taskController');

    const req = { params: { projectId: 1 } };
    const res = {
      json: (data) => { console.log('RESPONSE JSON:', JSON.stringify(data, null, 2)); },
      status: (code) => { return { json: (data) => { console.log('RESPONSE STATUS', code, JSON.stringify(data)); } }; }
    };

    await taskController.getKanbanTasks(req, res);
    process.exit(0);
  } catch (err) {
    console.error('debug-kanban error:', err);
    process.exit(1);
  }
})();
