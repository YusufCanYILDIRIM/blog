# (dashboard) route group

Yazar paneli bu route group altında olacak: `/panel`. Her yazar yalnızca kendi profilini,
projelerini ve yazılarını yönetir.

Yetki kontrolü layout'ta değil, her Server Action'ın ve servis sorgusunun içinde yapılır;
layout'taki oturum kontrolü yalnızca yönlendirme içindir.

> Aşama 3'te uygulanacak; şu an yalnızca yer tutucudur.
