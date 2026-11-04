# (auth) route group

Kimlik doğrulama akışına ait sayfalar bu route group altında yaşayacak: `login/`, `register/`,
`forgot-password/`, `reset-password/`. Parantezli isim (`(auth)`) URL'e yansımaz, yalnızca bu
sayfaları ortak bir layout (örn. merkezi, navbar'sız bir auth layout'u) altında gruplamak içindir.

> **Bu sprint kapsamında değildir.** Authentication implementasyonu (Auth.js v5 konfigürasyonu,
> login/register sayfaları) ayrı bir sprintte ele alınacaktır. Bu klasör şimdilik yalnızca
> mimarideki yerini işaretlemek için oluşturulmuştur.
