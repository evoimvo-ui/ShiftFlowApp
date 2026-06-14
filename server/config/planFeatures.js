const PLAN_FEATURES = { 
  basic:    { maxWorkers: 15,       groups: false }, 
  premium:  { maxWorkers: 100,      groups: true  }, 
  business: { maxWorkers: Infinity, groups: true  } 
}; 

module.exports = PLAN_FEATURES;
