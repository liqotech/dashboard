import React from 'react';

/**
 * Api class to manage authN
 */

function addUserLoaded(func) {
  func({
    id_token:
      'eyJhbGciOiJSUzI1NiIsImtpZCI6IndKaG9sSTRybXVVNEhEMjFIbG84dlFPU253Z01ORkRaa0hVYVl2b2V6MDQifQ.eyJpc3MiOiJrdWJlcm5ldGVzL3NlcnZpY2VhY2NvdW50Iiwia3ViZXJuZXRlcy5pby9zZXJ2aWNlYWNjb3VudC9uYW1lc3BhY2UiOiJsaXFvIiwia3ViZXJuZXRlcy5pby9zZXJ2aWNlYWNjb3VudC9zZWNyZXQubmFtZSI6ImxpcW9kYXNoLWFkbWluLXNhLXRva2VuLXpkdnRsIiwia3ViZXJuZXRlcy5pby9zZXJ2aWNlYWNjb3VudC9zZXJ2aWNlLWFjY291bnQubmFtZSI6ImxpcW9kYXNoLWFkbWluLXNhIiwia3ViZXJuZXRlcy5pby9zZXJ2aWNlYWNjb3VudC9zZXJ2aWNlLWFjY291bnQudWlkIjoiNWI5NGIzNTctZjk0ZS00MDdmLWExMTEtNTFmYzM0N2VlOTE2Iiwic3ViIjoic3lzdGVtOnNlcnZpY2VhY2NvdW50OmxpcW86bGlxb2Rhc2gtYWRtaW4tc2EifQ.AbRawOTf_adeeJIoA0t0bs9NUa8FSQAPyprFT4glyZuqRc5cDwR3NojwBXh7NWLLb76SpWTn7A95wVz2DxsDTqCQg48ebNgyL892Rfw28s7mfbgMb_WrSkfj3zSS6MYggrIU6MJ4Zvguaz3Qe8AyDBiggn9cZGeR0lod8knlvAnPcYBkHFbBlMr-GfX6MEcMdD5Hf5RvIdIdi8iHFrJESg08haCIuVKSZIWMbIOE5-Yx0-J6wK8u4bS8rDJMv_gAMNd_ijSMpv7rJzOcEvRsoLBa-3C12J_eQrdeIhdHbzG7cmEK4-D2HYoUNd5XQY6clQLTg3w3GhupScH2TcvTsg eyJhbGciOiJSUzI1NiIsImtpZCI6IndKaG9sSTRybXVVNEhEMjFIbG84dlFPU253Z01ORkRaa0hVYVl2b2V6MDQifQ.eyJpc3MiOiJrdWJlcm5ldGVzL3NlcnZpY2VhY2NvdW50Iiwia3ViZXJuZXRlcy5pby9zZXJ2aWNlYWNjb3VudC9uYW1lc3BhY2UiOiJsaXFvIiwia3ViZXJuZXRlcy5pby9zZXJ2aWNlYWNjb3VudC9zZWNyZXQubmFtZSI6ImxpcW9kYXNoLWFkbWluLXNhLXRva2VuLXpkdnRsIiwia3ViZXJuZXRlcy5pby9zZXJ2aWNlYWNjb3VudC9zZXJ2aWNlLWFjY291bnQubmFtZSI6ImxpcW9kYXNoLWFkbWluLXNhIiwia3ViZXJuZXRlcy5pby9zZXJ2aWNlYWNjb3VudC9zZXJ2aWNlLWFjY291bnQudWlkIjoiNWI5NGIzNTctZjk0ZS00MDdmLWExMTEtNTFmYzM0N2VlOTE2Iiwic3ViIjoic3lzdGVtOnNlcnZpY2VhY2NvdW50OmxpcW86bGlxb2Rhc2gtYWRtaW4tc2EifQ.AbRawOTf_adeeJIoA0t0bs9NUa8FSQAPyprFT4glyZuqRc5cDwR3NojwBXh7NWLLb76SpWTn7A95wVz2DxsDTqCQg48ebNgyL892Rfw28s7mfbgMb_WrSkfj3zSS6MYggrIU6MJ4Zvguaz3Qe8AyDBiggn9cZGeR0lod8knlvAnPcYBkHFbBlMr-GfX6MEcMdD5Hf5RvIdIdi8iHFrJESg08haCIuVKSZIWMbIOE5-Yx0-J6wK8u4bS8rDJMv_gAMNd_ijSMpv7rJzOcEvRsoLBa-3C12J_eQrdeIhdHbzG7cmEK4-D2HYoUNd5XQY6clQLTg3w3GhupScH2TcvTsg eyJhbGciOiJSUzI1NiIsImtpZCI6IndKaG9sSTRybXVVNEhEMjFIbG84dlFPU253Z01ORkRaa0hVYVl2b2V6MDQifQ.eyJpc3MiOiJrdWJlcm5ldGVzL3NlcnZpY2VhY2NvdW50Iiwia3ViZXJuZXRlcy5pby9zZXJ2aWNlYWNjb3VudC9uYW1lc3BhY2UiOiJsaXFvIiwia3ViZXJuZXRlcy5pby9zZXJ2aWNlYWNjb3VudC9zZWNyZXQubmFtZSI6ImxpcW9kYXNoLWFkbWluLXNhLXRva2VuLXpkdnRsIiwia3ViZXJuZXRlcy5pby9zZXJ2aWNlYWNjb3VudC9zZXJ2aWNlLWFjY291bnQubmFtZSI6ImxpcW9kYXNoLWFkbWluLXNhIiwia3ViZXJuZXRlcy5pby9zZXJ2aWNlYWNjb3VudC9zZXJ2aWNlLWFjY291bnQudWlkIjoiNWI5NGIzNTctZjk0ZS00MDdmLWExMTEtNTFmYzM0N2VlOTE2Iiwic3ViIjoic3lzdGVtOnNlcnZpY2VhY2NvdW50OmxpcW86bGlxb2Rhc2gtYWRtaW4tc2EifQ.AbRawOTf_adeeJIoA0t0bs9NUa8FSQAPyprFT4glyZuqRc5cDwR3NojwBXh7NWLLb76SpWTn7A95wVz2DxsDTqCQg48ebNgyL892Rfw28s7mfbgMb_WrSkfj3zSS6MYggrIU6MJ4Zvguaz3Qe8AyDBiggn9cZGeR0lod8knlvAnPcYBkHFbBlMr-GfX6MEcMdD5Hf5RvIdIdi8iHFrJESg08haCIuVKSZIWMbIOE5-Yx0-J6wK8u4bS8rDJMv_gAMNd_ijSMpv7rJzOcEvRsoLBa-3C12J_eQrdeIhdHbzG7cmEK4-D2HYoUNd5XQY6clQLTg3w3GhupScH2TcvTsg'
  });
}

function signinSilent() {
  if (!window.error)
    return Promise.resolve({
      id_token:
        'eyJhbGciOiJSUzI1NiIsImtpZCI6IndKaG9sSTRybXVVNEhEMjFIbG84dlFPU253Z01ORkRaa0hVYVl2b2V6MDQifQ.eyJpc3MiOiJrdWJlcm5ldGVzL3NlcnZpY2VhY2NvdW50Iiwia3ViZXJuZXRlcy5pby9zZXJ2aWNlYWNjb3VudC9uYW1lc3BhY2UiOiJsaXFvIiwia3ViZXJuZXRlcy5pby9zZXJ2aWNlYWNjb3VudC9zZWNyZXQubmFtZSI6ImxpcW9kYXNoLWFkbWluLXNhLXRva2VuLXpkdnRsIiwia3ViZXJuZXRlcy5pby9zZXJ2aWNlYWNjb3VudC9zZXJ2aWNlLWFjY291bnQubmFtZSI6ImxpcW9kYXNoLWFkbWluLXNhIiwia3ViZXJuZXRlcy5pby9zZXJ2aWNlYWNjb3VudC9zZXJ2aWNlLWFjY291bnQudWlkIjoiNWI5NGIzNTctZjk0ZS00MDdmLWExMTEtNTFmYzM0N2VlOTE2Iiwic3ViIjoic3lzdGVtOnNlcnZpY2VhY2NvdW50OmxpcW86bGlxb2Rhc2gtYWRtaW4tc2EifQ.AbRawOTf_adeeJIoA0t0bs9NUa8FSQAPyprFT4glyZuqRc5cDwR3NojwBXh7NWLLb76SpWTn7A95wVz2DxsDTqCQg48ebNgyL892Rfw28s7mfbgMb_WrSkfj3zSS6MYggrIU6MJ4Zvguaz3Qe8AyDBiggn9cZGeR0lod8knlvAnPcYBkHFbBlMr-GfX6MEcMdD5Hf5RvIdIdi8iHFrJESg08haCIuVKSZIWMbIOE5-Yx0-J6wK8u4bS8rDJMv_gAMNd_ijSMpv7rJzOcEvRsoLBa-3C12J_eQrdeIhdHbzG7cmEK4-D2HYoUNd5XQY6clQLTg3w3GhupScH2TcvTsg eyJhbGciOiJSUzI1NiIsImtpZCI6IndKaG9sSTRybXVVNEhEMjFIbG84dlFPU253Z01ORkRaa0hVYVl2b2V6MDQifQ.eyJpc3MiOiJrdWJlcm5ldGVzL3NlcnZpY2VhY2NvdW50Iiwia3ViZXJuZXRlcy5pby9zZXJ2aWNlYWNjb3VudC9uYW1lc3BhY2UiOiJsaXFvIiwia3ViZXJuZXRlcy5pby9zZXJ2aWNlYWNjb3VudC9zZWNyZXQubmFtZSI6ImxpcW9kYXNoLWFkbWluLXNhLXRva2VuLXpkdnRsIiwia3ViZXJuZXRlcy5pby9zZXJ2aWNlYWNjb3VudC9zZXJ2aWNlLWFjY291bnQubmFtZSI6ImxpcW9kYXNoLWFkbWluLXNhIiwia3ViZXJuZXRlcy5pby9zZXJ2aWNlYWNjb3VudC9zZXJ2aWNlLWFjY291bnQudWlkIjoiNWI5NGIzNTctZjk0ZS00MDdmLWExMTEtNTFmYzM0N2VlOTE2Iiwic3ViIjoic3lzdGVtOnNlcnZpY2VhY2NvdW50OmxpcW86bGlxb2Rhc2gtYWRtaW4tc2EifQ.AbRawOTf_adeeJIoA0t0bs9NUa8FSQAPyprFT4glyZuqRc5cDwR3NojwBXh7NWLLb76SpWTn7A95wVz2DxsDTqCQg48ebNgyL892Rfw28s7mfbgMb_WrSkfj3zSS6MYggrIU6MJ4Zvguaz3Qe8AyDBiggn9cZGeR0lod8knlvAnPcYBkHFbBlMr-GfX6MEcMdD5Hf5RvIdIdi8iHFrJESg08haCIuVKSZIWMbIOE5-Yx0-J6wK8u4bS8rDJMv_gAMNd_ijSMpv7rJzOcEvRsoLBa-3C12J_eQrdeIhdHbzG7cmEK4-D2HYoUNd5XQY6clQLTg3w3GhupScH2TcvTsg eyJhbGciOiJSUzI1NiIsImtpZCI6IndKaG9sSTRybXVVNEhEMjFIbG84dlFPU253Z01ORkRaa0hVYVl2b2V6MDQifQ.eyJpc3MiOiJrdWJlcm5ldGVzL3NlcnZpY2VhY2NvdW50Iiwia3ViZXJuZXRlcy5pby9zZXJ2aWNlYWNjb3VudC9uYW1lc3BhY2UiOiJsaXFvIiwia3ViZXJuZXRlcy5pby9zZXJ2aWNlYWNjb3VudC9zZWNyZXQubmFtZSI6ImxpcW9kYXNoLWFkbWluLXNhLXRva2VuLXpkdnRsIiwia3ViZXJuZXRlcy5pby9zZXJ2aWNlYWNjb3VudC9zZXJ2aWNlLWFjY291bnQubmFtZSI6ImxpcW9kYXNoLWFkbWluLXNhIiwia3ViZXJuZXRlcy5pby9zZXJ2aWNlYWNjb3VudC9zZXJ2aWNlLWFjY291bnQudWlkIjoiNWI5NGIzNTctZjk0ZS00MDdmLWExMTEtNTFmYzM0N2VlOTE2Iiwic3ViIjoic3lzdGVtOnNlcnZpY2VhY2NvdW50OmxpcW86bGlxb2Rhc2gtYWRtaW4tc2EifQ.AbRawOTf_adeeJIoA0t0bs9NUa8FSQAPyprFT4glyZuqRc5cDwR3NojwBXh7NWLLb76SpWTn7A95wVz2DxsDTqCQg48ebNgyL892Rfw28s7mfbgMb_WrSkfj3zSS6MYggrIU6MJ4Zvguaz3Qe8AyDBiggn9cZGeR0lod8knlvAnPcYBkHFbBlMr-GfX6MEcMdD5Hf5RvIdIdi8iHFrJESg08haCIuVKSZIWMbIOE5-Yx0-J6wK8u4bS8rDJMv_gAMNd_ijSMpv7rJzOcEvRsoLBa-3C12J_eQrdeIhdHbzG7cmEK4-D2HYoUNd5XQY6clQLTg3w3GhupScH2TcvTsg'
    });
  else return Promise.reject();
}

function addAccessTokenExpiring(func) {
  func();
}

function getManager() {
  return {
    events: {
      addUserLoaded: addUserLoaded,
      addAccessTokenExpiring: addAccessTokenExpiring
    },
    signinSilent: signinSilent
  };
}

export default function Authenticator() {
  let manager = getManager();

  const login = () => {
    window.history.pushState({}, '', '/callback?state=12345679');
    return true;
  };

  const completeLogin = () => {
    return true;
  };

  const logout = () => {
    return true;
  };

  return {
    manager,
    login,
    completeLogin,
    logout
  };
}
