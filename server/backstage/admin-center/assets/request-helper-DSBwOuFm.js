async function t(e){try{const r=await e();return r&&typeof r=="object"&&"error"in r?!r.error:!0}catch{return!1}}export{t as e};
