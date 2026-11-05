const KEY='casa-escuta-v1';
export const defaults={quality:'MEDIUM',volume:.6,sensitivity:1,motion:false,flashes:false,uiScale:1};
export function load(){try{const data=JSON.parse(localStorage.getItem(KEY));return data&&data.version===1?data:null}catch{return null}}
export function save(data){try{localStorage.setItem(KEY,JSON.stringify({...data,version:1}));return true}catch{return false}}
