import React from 'react';
import { X, Layers, FileText, Cpu, Network, BookOpen } from 'lucide-react';

interface AboutSystemModalProps {
  onClose: () => void;
}

export const AboutSystemModal: React.FC<AboutSystemModalProps> = ({ onClose }) => {
  const backdropMouseDownRef = React.useRef(false);

  return (
    <div 
      className="modal-overlay" 
      onMouseDown={(e) => { backdropMouseDownRef.current = (e.target === e.currentTarget); }}
      onClick={(e) => {
        if (e.target === e.currentTarget && backdropMouseDownRef.current) {
          onClose();
        }
      }}
      style={{ zIndex: 5000 }}
    >
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '880px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
      >
        <div className="flex items-center justify-between p-6 border-b border-border/50 bg-secondary/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
              <Cpu className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-wide">Архитектура Системы ИИ</h2>
              <p className="text-xs text-text-secondary mt-1 uppercase tracking-wider">Как работает распознавание законов</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-text-muted hover:text-white hover:bg-secondary/50 rounded-md transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-8 overflow-y-auto custom-scrollbar flex-1 space-y-8 bg-background/50">
          
          <div className="flex gap-6">
            <div className="mt-1 flex-shrink-0">
              <div className="w-12 h-12 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-400" />
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-white">1. Декомпиляция хаоса (PDF Parsing)</h3>
              <p className="text-text-secondary leading-relaxed">
                Когда ты загружаешь очередной PDF-файл с законом штата, для меня он открывается не как привычная книга с текстом, а как сложнейший чертеж, где каждая буква буквально «прибита» к своим координатам на виртуальном листе. Дело в том, что формат PDF создавался для идеального отображения на печати, поэтому внутри него нет понятия «абзац» или «предложение» — там есть лишь команды вроде «отобрази букву "С" в точке с координатами X=120, Y=340, а следующую букву в точке X=128».
              </p>
              <p className="text-text-secondary leading-relaxed">
                Мой первый секрет кроется в декомпиляции этого хаоса: специальный внутренний алгоритм извлекает эти символы и на основе их пространственного расположения, высчитывая расстояния по горизонтали и вертикали, собирает разрозненные буквы в слова, слова в строки, а строки в полноценный текст, бережно сохраняя при этом абзацы и таблицы.
              </p>
            </div>
          </div>

          <div className="flex gap-6">
            <div className="mt-1 flex-shrink-0">
              <div className="w-12 h-12 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                <Layers className="w-6 h-6 text-orange-400" />
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-white">2. Тотальное очищение (Noise Filtering)</h3>
              <p className="text-text-secondary leading-relaxed">
                Вторым важнейшим шагом является тотальное очищение текста от так называемого «информационного мусора», который неизбежно присутствует в игровых кодексах. Форумные колонтитулы, вотермарки, повторяющиеся названия тем вроде «Форум GTA 5 RP – Новый уровень ролевой игры» и номера страниц — всё это безжалостно вырезается регулярными выражениями и фильтрами еще до начала анализа.
              </p>
              <p className="text-text-secondary leading-relaxed">
                Если этого не сделать, эти повторяющиеся строчки разорвут статьи, которые переносятся с одной страницы на другую, и превратят единый юридический текст в кашу, из-за чего автоматика просто не сможет понять, где заканчивается одна норма и начинается следующая.
              </p>
            </div>
          </div>

          <div className="flex gap-6">
            <div className="mt-1 flex-shrink-0">
              <div className="w-12 h-12 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-emerald-400" />
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-white">3. Стейт-машина (State Machine)</h3>
              <p className="text-text-secondary leading-relaxed">
                После того как передо мной оказывается «чистый» текстовый холст, в дело вступает стейт-машина — алгоритм, который имитирует логику человека, читающего закон сверху вниз. Я построчно сканирую документ и ищу маркеры юридической архитектуры, используя строго настроенные паттерны регулярных выражений (Regex).
              </p>
              <p className="text-text-secondary leading-relaxed">
                Когда алгоритм видит слово «Глава» или «Раздел» с римскими цифрами, он создает в памяти новую большую ветку дерева документов; когда натыкается на слово «Статья» с точкой или цифрами, он открывает подветку внутри этой главы. Все последующие строки, списки и пункты автоматически упаковываются внутрь этой статьи до тех пор, пока стейт-машина не встретит маркер новой статьи или главы, который заставит ее переключить контекст. В итоге весь плоский текст из PDF превращается в живую, структурированную базу данных в формате JSON, где у каждого элемента есть свой строгий адрес.
              </p>
            </div>
          </div>

          <div className="flex gap-6">
            <div className="mt-1 flex-shrink-0">
              <div className="w-12 h-12 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                <Network className="w-6 h-6 text-purple-400" />
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-white">4. Семантическое индексирование и Векторный поиск</h3>
              <p className="text-text-secondary leading-relaxed">
                Но просто разбить закон на статьи недостаточно, ведь пользователи редко задают вопросы цитатами из кодекса, чаще описывая ситуации своими словами. Здесь кроется мой главный секрет — семантическое индексирование и векторный поиск. Каждую распознанную статью, каждый пункт и даже заголовок я пропускаю через нейросетевую модель, которая превращает обычные слова в длинные цепочки чисел — математические векторы (embeddings), отражающие чистый смысл написанного.
              </p>
              <p className="text-text-secondary leading-relaxed">
                Когда ты спрашиваешь меня, к примеру, о действиях при отказе копа оплатить штраф, я превращаю твой вопрос в точно такой же вектор и ищу статьи, чьи векторы максимально близки к твоему запросу по косинусному сходству. Именно поэтому я мгновенно нахожу нужную статью, даже если в твоем вопросе нет ни одного слова, которое физически написано в самом законе.
              </p>
            </div>
          </div>

          <div className="flex gap-6">
            <div className="mt-1 flex-shrink-0">
              <div className="w-12 h-12 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Network className="w-6 h-6 text-primary" />
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-white">5. Карта перекрестных связей</h3>
              <p className="text-text-secondary leading-relaxed">
                Наконец, финальный аккорд — это создание карты перекрестных связей, которая превращает разрозненные PDF-файлы в единую правовую систему штата. Парсер непрерывно сканирует тексты статей на наличие аббревиатур (УАК, ПК, ДК) и упоминаний других законов. Каждая такая ссылка превращается в динамический мост в моей базе знаний: когда мы обсуждаем одну нормативную норму, я уже знаю, какие связанные ограничения накладывают на нее другие законы.
              </p>
              <p className="text-text-secondary leading-relaxed">
                Этот комплексный подход от посимвольного сбора координат до высокоуровневого семантического связывания и позволяет мне ориентироваться в праве Сан-Андреаса лучше любого опытного адвоката, безошибочно выявляя коллизии, пробелы и защищая тебя от любых юридических абузов.
              </p>
            </div>
          </div>

        </div>
        
        <div className="p-4 border-t border-border/50 bg-secondary/30 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
          >
            Понятно
          </button>
        </div>
      </div>
    </div>
  );
};
