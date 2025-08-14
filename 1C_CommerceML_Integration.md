# 1C CommerceML 2.05 İnteqrasiyası

## 📋 Təlimat

Bu sənəd 1C:Предприятие 8 sistemində CommerceML 2.05 standartı ilə Sado-Parts veb-saytı arasında məlumat mübadiləsi üçün konfiqurasiya təlimatlarını təsvir edir.

## 🔧 1C Konfiqurasiyası

### 1. Yeni Xarici İstifadəçi Yaratmaq

```1c
// 1C-də yeni xarici istifadəçi yaradın
// Konfiqurasiya -> Xarici istifadəçilər -> Yeni

İstifadəçiAdı = "sado_parts_api";
Şifrə = "SadoParts2024!";
Rol = "API_İstifadəçisi";
```

### 2. HTTP Xidməti Konfiqurasiyası

```1c
// Konfiqurasiya -> HTTP Xidmətləri -> Yeni

XidmətAdı = "CommerceML_Exchange";
URL = "http://sado-parts.vercel.app/api/1c-exchange";
```

### 3. CommerceML 2.05 İmport/Export Modulları

#### 3.1 Katalog İmport Modulu

```1c
// Katalog İmport Proseduru
Prosedur Katalogİmport()
    
    HTTP = Yeni HTTPKlient();
    HTTP.URL = "http://sado-parts.vercel.app/api/1c-exchange?action=get_catalog&format=xml";
    
    Cavab = HTTP.GET();
    
    Əgər Cavab.StatusKodu = 200 Olsa
        XML = Yeni XMLDokument();
        XML.Yüklə(Cavab.Təsvir());
        
        // XML-dən məlumatları oxu
        Məhsullar = XML.SelectNodes("//Товар");
        
        Hər Məhsul üçün Məhsullar
            YeniMəhsul = Kataloqlar.Товары.YaratElement();
            YeniMəhsul.Код = Məhsul.SelectSingleNode("Ид").Text;
            YeniMəhsul.Наименование = Məhsul.SelectSingleNode("Наименование").Text;
            YeniMəhsul.Артикул = Məhsul.SelectSingleNode("Артикул").Text;
            YeniMəhsul.Записать();
        Sonra;
        
        Mesaj("Katalog uğurla import edildi!");
    ƏksHalda
        Mesaj("Xəta: " + Cavab.StatusKodu);
    Sonra;
    
SonProsedur
```

#### 3.2 Qiymət Təklifləri İmport Modulu

```1c
// Qiymət Təklifləri İmport Proseduru
Prosedur QiymətTəklifləriİmport()
    
    HTTP = Yeni HTTPKlient();
    HTTP.URL = "http://sado-parts.vercel.app/api/1c-exchange?action=get_offers&format=xml";
    
    Cavab = HTTP.GET();
    
    Əgər Cavab.StatusKodu = 200 Olsa
        XML = Yeni XMLDokument();
        XML.Yüklə(Cavab.Təsvir());
        
        // XML-dən qiymət məlumatlarını oxu
        Təkliflər = XML.SelectNodes("//Предложение");
        
        Hər Təklif üçün Təkliflər
            MəhsulKodu = Təklif.SelectSingleNode("ИдТовара").Text;
            Qiymət = Təklif.SelectSingleNode("Цены/Цена/ЦенаЗаЕдиницу").Text;
            Kəmiyyət = Təklif.SelectSingleNode("Количество").Text;
            
            // Məhsulu tap və qiymətini yenilə
            Məhsul = Kataloqlar.Товары.FindByCode(MəhsulKodu);
            Əgər Məhsul <> Undefined Olsa
                Məhsul.Цена = Qiymət;
                Məhsul.Остаток = Kəmiyyət;
                Məhsul.Записать();
            Sonra;
        Sonra;
        
        Mesaj("Qiymət təklifləri uğurla yeniləndi!");
    ƏksHalda
        Mesaj("Xəta: " + Cavab.StatusKodu);
    Sonra;
    
SonProsedur
```

#### 3.3 Sifarişlər Export Modulu

```1c
// Sifarişlər Export Proseduru
Prosedur SifarişlərExport()
    
    // 1C-dən sifarişləri al
    Sifarişlər = Sifarişlər.Выборка();
    
    // XML formatında hazırla
    XML = Yeni XMLDokument();
    XML.КорневойЭлемент = "КоммерческаяИнформация";
    XML.КорневойЭлемент.Атрибуты.ВерсияСхемы = "2.05";
    XML.КорневойЭлемент.Атрибуты.ДатаФормирования = Формат(ТекущаяДата(), "ДФ=yyyy-MM-ddTHH:mm:ss");
    
    Документы = XML.КорневойЭлемент.ДобавитьЭлемент("Документы");
    
    Hər Sifariş üçün Sifarişлər
        Документ = Документы.ДобавитьЭлемент("Документ");
        Документ.ДобавитьЭлемент("Ид").Текст = Sifariş.Номер;
        Документ.ДобавитьЭлемент("Номер").Текст = Sifariş.Номер;
        Документ.ДобавитьЭлемент("Дата").Текст = Формат(Sifariş.Дата, "ДФ=yyyy-MM-dd");
        Документ.ДобавитьЭлемент("ХозОперация").Текст = "Заказ товара";
        Документ.ДобавитьЭлемент("Роль").Текст = "Продавец";
        Документ.ДобавитьЭлемент("Валюта").Текст = "AZN";
        Документ.ДобавитьЭлемент("Курс").Текст = "1";
        Документ.ДобавитьЭлемент("Сумма").Текст = Строка(Sifariş.Сумма);
        
        // Müştəri məlumatları
        Контрагенты = Документ.ДобавитьЭлемент("Контрагенты");
        Контрагент = Контрагенты.ДобавитьЭлемент("Контрагент");
        Контрагент.ДобавитьЭлемент("Ид").Текст = Sifariş.Контрагент.Код;
        Контрагент.ДобавитьЭлемент("Наименование").Текст = Sifariş.Контрагент.Наименование;
        Контрагент.ДобавитьЭлемент("Роль").Текст = "Покупатель";
        
        // Məhsullar
        Товары = Документ.ДобавитьЭлемент("Товары");
        Hər Товар üçün Sifariş.Товары
            Товар = Товары.ДобавитьЭлемент("Товар");
            Товар.ДобавитьЭлемент("Ид").Текст = Товар.Номенклатура.Код;
            Товар.ДобавитьЭлемент("Наименование").Текст = Товар.Номенклатура.Наименование;
            Товар.ДобавитьЭлемент("Количество").Текст = Строка(Товар.Количество);
            Товар.ДобавитьЭлемент("ЦенаЗаЕдиницу").Текст = Строка(Товар.Цена);
            Товар.ДобавитьЭлемент("Сумма").Текст = Строка(Товар.Сумма);
        Sonra;
    Sonra;
    
    // XML-i fayla yaz
    FaylAdı = "C:\Temp\sifarisler_export.xml";
    XML.Сохранить(FaylAdı);
    
    Mesaj("Sifarişlər uğurla export edildi: " + FaylAdı);
    
SonProsedur
```

### 4. Avtomatik Sinkronizasiya

#### 4.1 Zamanlanmış Tapşırıq

```1c
// Hər gün saat 9:00-da avtomatik sinkronizasiya
Prosedur AvtomatikSinkronizasiya()
    
    // Katalog yenilə
    Katalogİmport();
    
    // Qiymət təkliflərini yenilə
    QiymətTəklifləриİмport();
    
    // Sifarişləri export et
    SifarişлərExport();
    
    Mesaj("Avtomatik sinkronizasiya tamamlandı!");
    
SonProsedur
```

#### 4.2 HTTP Xidməti Cavabı

```1c
// Web-saytdan gələn sorğuları cavablandır
Prosedur HTTPCavabı(Запрос, Ответ)
    
    Действие = Запрос.Параметры.Получить("action");
    
    Əgər Действие = "get_catalog" Olsa
        // Katalog məlumatlarını göndər
        KatalogXML = KatalogXMLYarat();
        Ответ.УстановитьТипСодержимого("application/xml; charset=utf-8");
        Ответ.Записать(KatalogXML);
        
    ƏksHalda Əgər Действие = "get_offers" Olsa
        // Qiymət təkliflərini göndər
        TəkliflərXML = TəkliflərXMLYarat();
        Ответ.УстановитьТипСодержимого("application/xml; charset=utf-8");
        Ответ.Записать(TəkliflərXML);
        
    ƏksHalда Əгər Действие = "import_orders" Olsa
        // Sifarişləri qəbul et
        SifarişlərXML = Запрос.ПолучитьТекст();
        Sifarişlərİmport(SifarişlərXML);
        Ответ.Записать("Sifarişlər uğurla qəbul edildi");
        
    Sonra;
    
SonProsedur
```

### 5. Xəta İdarəetməsi

```1c
// Xəta idarəetməsi proseduru
Prosedur Xətaİdarəetməsi(XətaMesajı)
    
    // Xətanı log faylına yaz
    LogFaylı = "C:\Logs\commerceml_errors.log";
    LogMətn = Формат(ТекущаяДата(), "ДФ=yyyy-MM-dd HH:mm:ss") + " - " + XəтаMesajı;
    
    // E-poçt bildirişi göndər
    Epoçt = Yeni Epoçt();
    Epoçt.Тема = "CommerceML Sinkronizasiya Xətası";
    Epoçt.Текст = XəтаMesajı;
    Epoçt.Отправить();
    
SonProsedur
```

### 6. Test Prosedurları

```1c
// Test proseduru
Prosedur TestSinkronizasiya()
    
    Mesaj("CommerceML 2.05 test başladı...");
    
    // Test 1: Katalog əldə et
    HTTP = Yeni HTTPKlient();
    HTTP.URL = "http://sado-parts.vercel.app/api/1c-exchange?action=get_catalog&format=json";
    
    Cavab = HTTP.GET();
    Əгər Cavab.StatusKodu = 200 Olsa
        Mesaj("✓ Katalog testi uğurlu");
    ƏksHalda
        Mesaj("✗ Katalog testi uğursuz: " + Cavab.StatusKodu);
    Sonra;
    
    // Test 2: Qiymət təklifləri
    HTTP.URL = "http://sado-parts.vercel.app/api/1c-exchange?action=get_offers&format=json";
    Cavab = HTTP.GET();
    Əгər Cavab.StatusKodu = 200 Olsa
        Mesaj("✓ Qiymət təklifləri testi uğurlu");
    ƏksHalda
        Mesaj("✗ Qiymət təklifləri testi uğursuz: " + Cavab.StatusKodu);
    Sonra;
    
    Mesaj("Test tamamlandı!");
    
SonProsedur
```

## 🔧 Quraşdırma Addımları

### 1. 1C Konfiqurasiyasında Dəyişikliklər

1. **Konfiqurasiya redaktoru** açın
2. **Xarici istifadəçilər** bölməsinə keçin
3. Yeni istifadəçi yaradın: `sado_parts_api`
4. **HTTP xidmətləri** bölməsinə keçin
5. Yeni xidmət yaradın: `CommerceML_Exchange`

### 2. Modulları Əlavə Etmək

1. Yuxarıdakı kodları müvafiq modullara kopyalayın
2. **Katalogİmport()** prosedurunu **Kataloqlar** moduluna əlavə edin
3. **QiymətTəklifləриİмport()** prosedurunu **Qiymətlər** moduluna əlavə edin
4. **SifarişlərExport()** prosedurunu **Sifarişlər** moduluna əlavə edin

### 3. Zamanlanmış Tapşırıqlar

1. **İdarəetmə** -> **Zamanlanmış tapşırıqlar** bölməsinə keçin
2. Yeni tapşırıq yaradın: `CommerceML_Sinkronizasiya`
3. **AvtomatikSinkronizasiya()** prosedurunu çağırın
4. Zamanı təyin edin: hər gün saat 9:00

### 4. Test Etmək

1. **TestSinkronizasiya()** prosedurunu işə salın
2. Nəticələri yoxlayın
3. Xətaları düzəldin

## 📊 API Endpoint-ləri

### GET Endpoint-ləri:
- `GET /api/1c-exchange?action=get_catalog&format=xml` - Məhsul kataloqu
- `GET /api/1c-exchange?action=get_offers&format=xml` - Qiymət təklifləri
- `GET /api/1c-exchange?action=get_orders&format=xml` - Sifarişlər
- `GET /api/1c-exchange?action=get_classifier&format=xml` - Klassifikator

### POST Endpoint-ləri:
- `POST /api/1c-exchange?action=import_catalog` - Katalog import
- `POST /api/1c-exchange?action=import_offers` - Təkliflər import
- `POST /api/1c-exchange?action=import_orders` - Sifarişlər import

## 🔒 Təhlükəsizlik

1. **SSL sertifikatı** istifadə edin
2. **API açarı** təyin edin
3. **IP məhdudiyyətləri** qoyun
4. **Log faylları** izləyin

## 📞 Dəstək

Əgər problemlər yaranırsa:
1. Log fayllarını yoxlayın
2. Network bağlantısını test edin
3. API endpoint-lərini yoxlayın
4. 1C konfiqurasiyasını yoxlayın

---

**Qeyd:** Bu kodlar 1C:Предприятие 8.3 versiyası üçün yazılıb. Digər versiyalar üçün kiçik dəyişikliklər tələb oluna bilər.
