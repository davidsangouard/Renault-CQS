'use strict';

const API = (() => {
  async function req(method, path, body) {
    const opts = { method, headers: { 'Content-Type': 'application/json' } };
    if (body !== undefined) opts.body = JSON.stringify(body);
    const res = await fetch('api/' + path, opts);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Erreur ' + res.status);
    return data;
  }
  return {
    getSession:   ()       => req('GET',    'auth.php'),
    login:        (ipn)    => req('POST',   'auth.php', { action:'login', ipn }),
    logout:       ()       => req('DELETE', 'auth.php'),
    checkManager: (ipn)    => req('POST',   'auth.php', { action:'manager_check', ipn }),
    saveFilter:   (filter) => req('POST',   'auth.php', { action:'filter', filter }),
    getConfig:    ()       => req('GET',    'config.php'),
    saveConfig:   (cfg)    => req('POST',   'config.php', cfg),
    getOfs:        ()          => req('GET',    'ofs.php'),
    createOf:      (ofData)    => req('POST',   'ofs.php', ofData),
    saveVerif:     (payload)   => req('PATCH',  'ofs.php', payload),
    deleteOf:      (id)        => req('DELETE', 'ofs.php?id=' + encodeURIComponent(id)),
    getOpImages:    (organe,op) => req('GET',    'images.php?organe=' + encodeURIComponent(organe) + '&op=' + encodeURIComponent(op)),
    uploadOpImage:  (data)      => req('POST',   'images.php', data),
    deleteOpImage:  (id)        => req('DELETE', 'images.php?id=' + encodeURIComponent(id)),
  };
})();

Object.assign(window, { API });
