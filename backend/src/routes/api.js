const express = require('express');
const router = express.Router();
const serviceHourController = require('../controllers/serviceHourController');
const pmController = require('../controllers/pmController');
const realizationController = require('../controllers/realizationController');
const materialController = require('../controllers/materialController');

// Service Hours
router.get('/service-hours', serviceHourController.getServiceHours);

// PM Schedule
router.get('/pm/schedule', pmController.getPMSchedule);

// Realizations
router.get('/pm/realizations', realizationController.getRealizations);
router.get('/pm/realizations/:id', realizationController.getRealizationDetail);
router.post('/pm/realizations', realizationController.createRealization);
// router.put('/pm/realizations/:id', realizationController.updateRealization); // If needed
router.delete('/pm/realizations/:id', realizationController.deleteRealization);

// Materials
router.get('/materials', materialController.getMaterialsByUnit);

module.exports = router;
