// Mobile-safe data loader. The deployment workflow generates data-plain.js.
loadData = async function(){
  if (Array.isArray(window.__DATA__) && window.__DATA__.length) return window.__DATA__;
  throw new Error('Plain activity data is unavailable');
};
