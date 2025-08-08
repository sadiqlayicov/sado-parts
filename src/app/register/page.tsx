'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    inn: '',
    country: '',
    city: '',
    address: '',
    password: '',
    confirmPassword: '',
    terms: false
  });

  // Countries and cities data
  const countries = [
    { 
      name: 'Azerbaijan', 
      cities: [
        'Baku', 'Ganja', 'Sumgayit', 'Mingachevir', 'Lankaran', 'Shaki', 'Yevlakh', 'Nakhchivan',
        'Shirvan', 'Goychay', 'Agdash', 'Ujar', 'Zardab', 'Kurdamir', 'Yevlakh', 'Aghjabadi',
        'Beylagan', 'Fuzuli', 'Jabrayil', 'Khojavend', 'Shusha', 'Kalbajar', 'Lachin', 'Qubadli',
        'Zangilan', 'Gubadli', 'Astara', 'Masalli', 'Yardimli', 'Lerik', 'Jalilabad', 'Bilasuvar',
        'Salyan', 'Neftchala', 'Hajigabul', 'Shamakhi', 'Ismayilli', 'Aghsu', 'Gobustan', 'Absheron'
      ] 
    },
    { 
      name: 'Russia', 
      cities: [
        'Moscow', 'Saint Petersburg', 'Novosibirsk', 'Yekaterinburg', 'Kazan', 'Nizhny Novgorod',
        'Chelyabinsk', 'Samara', 'Omsk', 'Rostov-on-Don', 'Ufa', 'Krasnoyarsk', 'Perm', 'Voronezh',
        'Volgograd', 'Krasnodar', 'Saratov', 'Tyumen', 'Tolyatti', 'Izhevsk', 'Barnaul', 'Ulyanovsk',
        'Irkutsk', 'Khabarovsk', 'Yaroslavl', 'Vladivostok', 'Makhachkala', 'Tomsk', 'Orenburg',
        'Kemerovo', 'Novokuznetsk', 'Ryazan', 'Astrakhan', 'Naberezhnye Chelny', 'Penza', 'Lipetsk',
        'Kirov', 'Cheboksary', 'Tula', 'Kaliningrad', 'Kursk', 'Ulan-Ude', 'Stavropol', 'Sochi'
      ] 
    },
    { 
      name: 'Turkey', 
      cities: [
        'Istanbul', 'Ankara', 'Izmir', 'Bursa', 'Antalya', 'Adana', 'Gaziantep', 'Konya', 'Mersin',
        'Diyarbakir', 'Samsun', 'Denizli', 'Eskisehir', 'Urfa', 'Malatya', 'Erzurum', 'Van', 'Batman',
        'Elazig', 'Tokat', 'Sivas', 'Trabzon', 'Erzincan', 'Kahramanmaras', 'Aydin', 'Tekirdag',
        'Manisa', 'Balikesir', 'Hatay', 'Osmaniye', 'Kilis', 'Kars', 'Iğdır', 'Ardahan', 'Artvin',
        'Rize', 'Giresun', 'Ordu', 'Gümüşhane', 'Bayburt', 'Ağrı', 'Muş', 'Bingöl', 'Tunceli'
      ] 
    },
    { 
      name: 'Georgia', 
      cities: [
        'Tbilisi', 'Batumi', 'Kutaisi', 'Rustavi', 'Gori', 'Zugdidi', 'Poti', 'Khashuri', 'Samtredia',
        'Senaki', 'Zestaponi', 'Marneuli', 'Telavi', 'Akhaltsikhe', 'Ozurgeti', 'Kaspi', 'Chiatura',
        'Tsqaltubo', 'Sagarejo', 'Gurjaani', 'Kvareli', 'Akhmeta', 'Dusheti', 'Tianeti', 'Mtskheta',
        'Dmanisi', 'Bolnisi', 'Gardabani', 'Lagodekhi', 'Sighnaghi', 'Dedoplistskaro', 'Ninotsminda',
        'Akhalgori', 'Tsalka', 'Tetritskaro', 'Manglisi', 'Bakuriani', 'Borjomi', 'Khulo', 'Shuakhevi'
      ] 
    },
    { 
      name: 'Ukraine', 
      cities: [
        'Kyiv', 'Kharkiv', 'Odesa', 'Dnipro', 'Donetsk', 'Lviv', 'Zaporizhzhia', 'Kryvyi Rih',
        'Mykolaiv', 'Mariupol', 'Luhansk', 'Vinnytsia', 'Poltava', 'Chernihiv', 'Cherkasy', 'Sumy',
        'Khmelnytskyi', 'Zhytomyr', 'Rivne', 'Ivano-Frankivsk', 'Ternopil', 'Lutsk', 'Uzhhorod',
        'Chernivtsi', 'Kropyvnytskyi', 'Kremenchuk', 'Bila Tserkva', 'Kramatorsk', 'Melitopol',
        'Nikopol', 'Sloviansk', 'Berdiansk', 'Sieverodonetsk', 'Alchevsk', 'Lysychansk', 'Kostiantynivka'
      ] 
    },
    { 
      name: 'Kazakhstan', 
      cities: [
        'Almaty', 'Nur-Sultan', 'Shymkent', 'Aktobe', 'Karaganda', 'Taraz', 'Pavlodar', 'Semey',
        'Oskemen', 'Atyrau', 'Kyzylorda', 'Kostanay', 'Petropavl', 'Aktau', 'Temirtau', 'Turkestan',
        'Kokshetau', 'Taldykorgan', 'Ekibastuz', 'Rudny', 'Zhezkazgan', 'Kentau', 'Balqash', 'Zhanaozen'
      ] 
    },
    { 
      name: 'Uzbekistan', 
      cities: [
        'Tashkent', 'Samarkand', 'Bukhara', 'Andijan', 'Namangan', 'Nukus', 'Fergana', 'Qarshi',
        'Jizzakh', 'Urgench', 'Termez', 'Navoiy', 'Angren', 'Chirchiq', 'Bekabad', 'Kokand',
        'Margilan', 'Denau', 'Kattakurgan', 'Kosonsoy', 'Kagan', 'Chust', 'Yangiyer', 'Guliston'
      ] 
    },
    { 
      name: 'Kyrgyzstan', 
      cities: [
        'Bishkek', 'Osh', 'Jalal-Abad', 'Karakol', 'Tokmok', 'Kara-Balta', 'Naryn', 'Talas',
        'Balykchy', 'Kant', 'Kara-Suu', 'Uzgen', 'Cholpon-Ata', 'Isfana', 'Kyzyl-Kiya', 'Bazar-Korgon'
      ] 
    },
    { 
      name: 'Tajikistan', 
      cities: [
        'Dushanbe', 'Khujand', 'Kulob', 'Qurghonteppa', 'Istaravshan', 'Vahdat', 'Tursunzoda',
        'Konibodom', 'Isfara', 'Panjakent', 'Vose', 'Yovon', 'Norak', 'Rogun', 'Farkhor', 'Kolkhozobod'
      ] 
    },
    { 
      name: 'Turkmenistan', 
      cities: [
        'Ashgabat', 'Türkmenabat', 'Dasoguz', 'Mary', 'Balkanabat', 'Bayramaly', 'Tejen',
        'Kaka', 'Gumdag', 'Bereket', 'Gazojak', 'Serdar', 'Konye-Urgench', 'Türkmenbaşy', 'Hazar'
      ] 
    },
    { 
      name: 'Iran', 
      cities: [
        'Tehran', 'Mashhad', 'Isfahan', 'Tabriz', 'Shiraz', 'Kerman', 'Yazd', 'Qom', 'Kermanshah',
        'Urmia', 'Rasht', 'Hamadan', 'Arak', 'Ardabil', 'Zanjan', 'Sanandaj', 'Bojnord', 'Yasuj',
        'Bushehr', 'Bandar Abbas', 'Khorramabad', 'Gorgan', 'Sari', 'Shahrekord', 'Ilam', 'Qazvin'
      ] 
    },
    { 
      name: 'Pakistan', 
      cities: [
        'Karachi', 'Lahore', 'Faisalabad', 'Rawalpindi', 'Multan', 'Hyderabad', 'Gujranwala',
        'Peshawar', 'Quetta', 'Islamabad', 'Bahawalpur', 'Sargodha', 'Sialkot', 'Sukkur', 'Larkana',
        'Sheikhupura', 'Rahim Yar Khan', 'Jhang', 'Dera Ghazi Khan', 'Gujrat', 'Sahiwal', 'Wah Cantonment'
      ] 
    },
    { 
      name: 'Afghanistan', 
      cities: [
        'Kabul', 'Kandahar', 'Herat', 'Mazar-i-Sharif', 'Jalalabad', 'Kunduz', 'Ghazni', 'Balkh',
        'Baghlan', 'Gardez', 'Khost', 'Pul-e-Khumri', 'Charikar', 'Sheberghan', 'Sar-e-Pul', 'Kunar'
      ] 
    },
    { 
      name: 'China', 
      cities: [
        'Beijing', 'Shanghai', 'Guangzhou', 'Shenzhen', 'Tianjin', 'Chongqing', 'Chengdu', 'Nanjing',
        'Wuhan', 'Xi\'an', 'Hangzhou', 'Dongguan', 'Foshan', 'Jinan', 'Dalian', 'Qingdao', 'Kunming',
        'Zhengzhou', 'Changsha', 'Harbin', 'Suzhou', 'Shijiazhuang', 'Ningbo', 'Hefei', 'Fuzhou'
      ] 
    },
    { 
      name: 'India', 
      cities: [
        'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune', 'Ahmedabad',
        'Jaipur', 'Surat', 'Lucknow', 'Kanpur', 'Nagpur', 'Indore', 'Thane', 'Bhopal', 'Visakhapatnam',
        'Pimpri-Chinchwad', 'Patna', 'Vadodara', 'Ghaziabad', 'Ludhiana', 'Agra', 'Nashik', 'Faridabad'
      ] 
    },
    { 
      name: 'Germany', 
      cities: [
        'Berlin', 'Hamburg', 'Munich', 'Cologne', 'Frankfurt', 'Stuttgart', 'Düsseldorf', 'Dortmund',
        'Essen', 'Leipzig', 'Bremen', 'Dresden', 'Hannover', 'Nuremberg', 'Duisburg', 'Bochum',
        'Wuppertal', 'Bielefeld', 'Bonn', 'Münster', 'Karlsruhe', 'Mannheim', 'Augsburg', 'Wiesbaden'
      ] 
    },
    { 
      name: 'France', 
      cities: [
        'Paris', 'Marseille', 'Lyon', 'Toulouse', 'Nice', 'Nantes', 'Strasbourg', 'Montpellier',
        'Bordeaux', 'Lille', 'Rennes', 'Reims', 'Le Havre', 'Saint-Étienne', 'Toulon', 'Angers',
        'Grenoble', 'Dijon', 'Nîmes', 'Saint-Denis', 'Le Mans', 'Aix-en-Provence', 'Clermont-Ferrand'
      ] 
    },
    { 
      name: 'United Kingdom', 
      cities: [
        'London', 'Birmingham', 'Leeds', 'Glasgow', 'Sheffield', 'Bradford', 'Edinburgh', 'Liverpool',
        'Manchester', 'Bristol', 'Wakefield', 'Cardiff', 'Coventry', 'Nottingham', 'Leicester',
        'Sunderland', 'Belfast', 'Newcastle upon Tyne', 'Brighton', 'Hull', 'Plymouth', 'Stoke-on-Trent'
      ] 
    },
    { 
      name: 'United States', 
      cities: [
        'New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio',
        'San Diego', 'Dallas', 'San Jose', 'Austin', 'Jacksonville', 'Fort Worth', 'Columbus',
        'Charlotte', 'San Francisco', 'Indianapolis', 'Seattle', 'Denver', 'Washington', 'Boston',
        'El Paso', 'Nashville', 'Detroit', 'Oklahoma City', 'Portland', 'Las Vegas', 'Memphis'
      ] 
    }
  ];

  const getCitiesForCountry = (countryName: string) => {
    const country = countries.find(c => c.name === countryName);
    return country ? country.cities : [];
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const validateForm = () => {
    if (!formData.firstName.trim()) {
      alert('Имя обязательно');
      return false;
    }
    if (!formData.lastName.trim()) {
      alert('Фамилия обязательна');
      return false;
    }
    if (!formData.email.trim()) {
      alert('Email обязателен');
      return false;
    }
    if (!formData.phone.trim()) {
      alert('Telefon tələb olunur');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      alert('Пароли не совпадают!');
      return false;
    }
    if (!formData.terms) {
      alert('Необходимо принять условия использования');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          inn: formData.inn,
          country: formData.country,
          city: formData.city,
          address: formData.address,
          password: formData.password
        })
      });

      // Check if response is ok before trying to parse JSON
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server error response:', errorText);
        
        // Try to parse as JSON, if it fails, show the raw text
        try {
          const errorData = JSON.parse(errorText);
          alert(errorData.error || 'Произошла ошибка при регистрации');
        } catch (parseError) {
          alert('Server xətası: ' + errorText);
        }
        return;
      }

      const data = await response.json();

      if (data.success) {
        // Show success message briefly, then redirect to home page
        alert('Регистрация успешно завершена! Вы будете перенаправлены на главную страницу.');
        
        // Reset form
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          inn: '',
          country: '',
          city: '',
          address: '',
          password: '',
          confirmPassword: '',
          terms: false
        });
        
        // Redirect to home page after a short delay
        setTimeout(() => {
          router.push('/');
        }, 1000);
      } else {
        alert(data.error || 'Произошла ошибка при регистрации');
      }
    } catch (error) {
      console.error('Registration error:', error);
      alert('Произошла ошибка при регистрации. Пожалуйста, попробуйте еще раз.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0ea5e9] text-white flex items-center justify-center p-8">
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 w-full max-w-md shadow-2xl border border-white/20">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold mb-2 neon-text">Регистрация</h2>
          <p className="text-gray-300">Создайте новый аккаунт</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium mb-2">Имя</label>
              <input 
                type="text" 
                id="firstName" 
                name="firstName" 
                value={formData.firstName}
                onChange={handleInputChange}
                required 
                disabled={isLoading}
                className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-300 focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition disabled:opacity-50"
                placeholder="Введите ваше имя"
              />
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium mb-2">Фамилия</label>
              <input 
                type="text" 
                id="lastName" 
                name="lastName" 
                value={formData.lastName}
                onChange={handleInputChange}
                required 
                disabled={isLoading}
                className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-300 focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition disabled:opacity-50"
                placeholder="Введите вашу фамилию"
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2">Email</label>
            <input 
              type="email" 
              id="email" 
              name="email" 
              value={formData.email}
              onChange={handleInputChange}
              required 
              disabled={isLoading}
              className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-300 focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition disabled:opacity-50"
              placeholder="email@example.com"
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium mb-2">Телефон</label>
            <input 
              type="tel" 
              id="phone" 
              name="phone" 
              value={formData.phone}
              onChange={handleInputChange}
              required 
              disabled={isLoading}
              className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-300 focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition disabled:opacity-50"
              placeholder="+994 50 123 45 67"
            />
          </div>

          <div>
            <label htmlFor="inn" className="block text-sm font-medium mb-2">ВОЕН (ИНН)</label>
            <input 
              type="text" 
              id="inn" 
              name="inn" 
              value={formData.inn}
              onChange={handleInputChange}
              disabled={isLoading}
              className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-300 focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition disabled:opacity-50"
              placeholder="Введите ваш ВОЕН"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="country" className="block text-sm font-medium mb-2">Страна</label>
              <select
                id="country"
                name="country"
                value={formData.country}
                onChange={handleInputChange}
                disabled={isLoading}
                className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition disabled:opacity-50"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  color: 'white'
                }}
              >
                <option value="" style={{ backgroundColor: '#1e293b', color: 'white' }}>Выберите страну</option>
                {countries.map((country) => (
                  <option 
                    key={country.name} 
                    value={country.name}
                    style={{ backgroundColor: '#1e293b', color: 'white' }}
                  >
                    {country.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="city" className="block text-sm font-medium mb-2">Город</label>
              <select
                id="city"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                disabled={isLoading || !formData.country}
                className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  color: 'white'
                }}
              >
                <option value="" style={{ backgroundColor: '#1e293b', color: 'white' }}>Выберите город</option>
                {formData.country && getCitiesForCountry(formData.country).map((city) => (
                  <option 
                    key={city} 
                    value={city}
                    style={{ backgroundColor: '#1e293b', color: 'white' }}
                  >
                    {city}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="address" className="block text-sm font-medium mb-2">Адрес</label>
            <textarea
              id="address"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              rows={3}
              disabled={isLoading}
              className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-300 focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition disabled:opacity-50 resize-none"
              placeholder="Введите ваш адрес"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2">Пароль</label>
              <input 
                type="password" 
                id="password" 
                name="password" 
                value={formData.password}
                onChange={handleInputChange}
                required 
                disabled={isLoading}
                className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-300 focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition disabled:opacity-50"
                placeholder="Введите ваш пароль"
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">Подтвердите пароль</label>
              <input 
                type="password" 
                id="confirmPassword" 
                name="confirmPassword" 
                value={formData.confirmPassword}
                onChange={handleInputChange}
                required 
                disabled={isLoading}
                className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-300 focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition disabled:opacity-50"
                placeholder="Повторите ваш пароль"
              />
            </div>
          </div>

          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input 
                id="terms" 
                name="terms" 
                type="checkbox" 
                checked={formData.terms}
                onChange={handleInputChange}
                required 
                disabled={isLoading}
                className="h-4 w-4 text-cyan-500 focus:ring-cyan-500 border-white/20 rounded disabled:opacity-50 bg-white/10"
              />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="terms" className="font-medium text-gray-300">
                Я принимаю условия использования
              </label>
            </div>
          </div>

          <div>
            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full px-6 py-3 rounded-lg bg-cyan-500 hover:bg-cyan-600 disabled:bg-cyan-400 font-semibold text-lg transition duration-200 shadow-md hover:transform hover:-translate-y-1px disabled:transform-none"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Регистрация...
                </div>
              ) : (
                'Зарегистрироваться'
              )}
            </button>
          </div>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-300">
            У вас уже есть аккаунт?{' '}
            <a href="/login" className="text-cyan-400 hover:text-cyan-300 font-medium">
              Войти
            </a>
          </p>
        </div>
      </div>



      <style jsx>{`
        @keyframes scaleIn {
          0% { transform: scale(0.8); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-scaleIn {
          animation: scaleIn 0.3s ease-out;
        }
        .neon-text {
          text-shadow: 0 0 10px rgba(6, 182, 212, 0.5), 0 0 20px rgba(6, 182, 212, 0.3);
        }
        
        /* Select dropdown styles */
        select {
          background-color: rgba(255, 255, 255, 0.1) !important;
          color: white !important;
        }
        
        select option {
          background-color: #1e293b !important;
          color: white !important;
          padding: 8px;
        }
        
        select option:hover {
          background-color: #334155 !important;
        }
        
        select:focus option:checked {
          background-color: #0ea5e9 !important;
        }
        
        /* Custom scrollbar for select dropdowns */
        select::-webkit-scrollbar {
          width: 8px;
        }
        
        select::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
        }
        
        select::-webkit-scrollbar-thumb {
          background: rgba(6, 182, 212, 0.5);
          border-radius: 4px;
        }
        
        select::-webkit-scrollbar-thumb:hover {
          background: rgba(6, 182, 212, 0.7);
        }
      `}</style>
    </main>
  );
} 