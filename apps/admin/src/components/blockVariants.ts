// Варианты и подварианты блоков для редактора страницы
export const BLOCK_VARIANTS = [
  {
    type: 'text',
    label: 'Текстовый блок',
    icon: 'text',
    subvariants: [
      {
        id: 'TX01',
        name: 'TX01',
        title: 'Текст',
        description: 'Обычный текстовый блок.',
        preview: '/previews/tx01.bmp',
        defaultContent: { html: '' },
      },
      {
        id: 'TX02',
        name: 'TX02',
        title: 'Узкий текстовый блок',
        description: 'Ширина 60% от всей ширины страницы. Подходит для привлечения внимания читателя к определенной фразе.',
        preview: '/previews/tx02.bmp',
        defaultContent: { html: '', variant: 'TX02' },
      },
      {
        id: 'TX03',
        name: 'TX03',
        title: 'Узкий текстовый блок c выравниванием по центру',
        description: 'Ширина 60% от всей ширины страницы, текст с выравниванием по центру.',
        preview: '/previews/tx03.bmp',
        defaultContent: { html: '', variant: 'TX03' },
      },
      {
        id: 'TX04',
        name: 'TX04',
        title: 'Мелкий текст',
        description: 'Шрифт меньшего размера для второстепенной информации.',
        preview: '/previews/tx04.bmp',
        defaultContent: { html: '', variant: 'TX04' },
      },
      {
        id: 'TX05',
        name: 'TX05',
        title: 'Крупный текст',
        description: '',
        preview: '/previews/tx05.bmp',
        defaultContent: { html: '', variant: 'TX05' },
      },
      {
        id: 'TX06',
        name: 'TX06',
        title: 'Красивый текст',
        description: 'Подходит для ключевых фраз.',
        preview: '/previews/tx06.bmp',
        defaultContent: { html: '', variant: 'TX06' },
      },
      {
        id: 'TX07',
        name: 'TX07',
        title: 'Красивый текст с заглавными буквами',
        description: '',
        preview: '/previews/tx07.bmp',
        defaultContent: { html: '', variant: 'TX07' },
      },
      {
        id: 'TX08',
        name: 'TX08',
        title: 'Синий красивый текст с заглавными буквами',
        description: 'Отличается от предыдущего - синим цветом.',
        preview: '/previews/tx08.bmp',
        defaultContent: { html: '', variant: 'TX08' },
      },
      {
        id: 'TX09',
        name: 'TX09',
        title: 'Цитата',
        description: '',
        preview: '/previews/tx09.bmp',
        defaultContent: { html: '', variant: 'TX09' },
      },
      {
        id: 'TX10',
        name: 'TX10',
        title: 'Текст с линией сверху',
        description: 'Так же подходит для цитат.',
        preview: '/previews/tx10.bmp',
        defaultContent: { html: '', variant: 'TX10' },
      },
      {
        id: 'TX11',
        name: 'TX11',
        title: 'Заметка с типом',
        description: 'Информационный текст с выбором типа и иконки',
        preview: '/previews/tx11.bmp',
        defaultContent: {
          html: '',
          variant: 'TX11',
          noteType: 'info', // info | warning | explanation
          icon: 'bi bi-info-lg', // default icon
          color: 'blue', // blue | red | green
        },
        types: [
          { value: 'info', label: 'Инфо', color: 'blue', icons: ['bi bi-info-lg', 'bi bi-info-square'] },
          { value: 'warning', label: 'Warning', color: 'red', icons: ['bi bi-lightbulb', 'bi bi-exclamation-square'] },
          { value: 'explanation', label: 'Объяснение', color: 'green', icons: ['bi bi-exclamation-circle', 'bi bi-bookmarks-fill'] }
        ]
      }
    ],
  },
  {
    type: 'button',
    label: 'Кнопка',
    icon: 'button',
    subvariants: [
      {
        id: 'BF01',
        name: 'BF01',
        title: 'Закрашенная кнопка',
        description: 'Закрашенная кнопка синего цвета.',
        preview: '/previews/bf01.bmp',
        defaultContent: { text: '', url: '' },
      },
      {
        id: 'BF02',
        name: 'BF02',
        title: 'Кнопка прозрачная',
        description: '',
        preview: '/previews/bf02.bmp',
        defaultContent: { text: '', url: '' },
      },
      {
        id: 'BF03',
        name: 'BF03',
        title: 'Кнопка прозрачная со стрелкой',
        description: '',
        preview: '/previews/bf03.bmp',
        defaultContent: { text: '', url: '' },
      },
      {
        id: 'BF04',
        name: 'BF04',
        title: 'Необычная кнопка',
        description: '',
        preview: '/previews/bf04.bmp',
        defaultContent: { text: '', url: '' },
      },
      {
        id: 'BF05',
        name: 'BF05',
        title: 'Минималистичная кнопка',
        description: 'Выглядит как просто текст с подчёркиванием.',
        preview: '/previews/bf05.bmp',
        defaultContent: { text: '', url: '' },
      },
      {
        id: 'BF06',
        name: 'BF06',
        title: 'Минималистичная кнопка со стрелкой',
        description: 'Более интересный вариант предыдущей кнопки, с иконкой стрелки.',
        preview: '/previews/bf06.png',
        defaultContent: { text: '', url: '' },
      },
    ],
  },
  // тип блока: Колонки
  {
    type: 'qa',
    label: 'Вопрос-Ответ',
    icon: 'help',
    subvariants: [
      {
        id: 'QA01',
        name: 'QA01',
        title: 'Ответ в раскрывающихся карточках',
        description: 'Список вопросов с ответами, где ответ открывается по клику. Вопрос — строка, ответ — редактор.',
        preview: '/previews/qa01.bmp',
        defaultContent: {
          items: [
            { question: 'Вопрос номер 1', answer: { html: '<p>ответ на первый вопрос </p>' } }
          ]
        },
      },{
        id: 'QA02',
        name: 'QA02',
        title: 'Ответ в раскрывающихся карточках',
        description: 'Список вопросов с ответами, где ответ открывается по клику. Вопрос — строка, ответ — редактор.',
        preview: '/previews/qa02.bmp',
        defaultContent: {
          items: [
            { question: 'Вопрос номер 1', answer: { html: '<p>ответ на первый вопрос </p>' } }
          ]
        },
      },
    ],
  },
  {
    type: 'note',
    label: 'Заметка',
    icon: 'note',
    subvariants: [
      {
        id: 'NT01',
        name: 'NT01',
        title: 'Заметка',
        description: 'Минималистичная заметка',
        preview: '/previews/nt01.bmp',
        defaultContent: {
          html: '',
          variant: 'NT01',
          icon: 'bi bi-info-square', // default icon
          noteType: 'info', // info (темно-синий) | default (черный) | warning | lighting
        },
        icons: [
          { value: 'bi bi-info-square', label: 'Info (темно-синий)' },
          { value: 'bi bi-bookmarks-fill', label: 'Default (черный)' }
        ]
      },
      {
        id: 'NT02',
        name: 'NT02',
        title: 'Заметка с полоской слева',
        description: '',
        preview: '/previews/nt02.bmp',
        defaultContent: {
          html: '',
          variant: 'NT02',
          noteType: 'info', 
          icon: 'bi bi-info-lg',
          text: ''
        },
        icons: [
          { value: 'info', label: 'Инфо', icon: 'bi bi-info-lg' },
          { value: 'warning', label: 'Warning', icon: 'bi bi-lightbulb' },
          { value: 'explanation', label: 'Объяснение', icon: 'bi bi-exclamation-circle' }
        ]
      },
      {
        id: 'NT03',
        name: 'NT03',
        title: 'Заметка на подложке',
        description: 'Заметка с цветным фоном и иконкой слева. Цвет фона зависит от типа заметки.',
        preview: '/previews/nt03.bmp',
        defaultContent: {
          html: '',
          variant: 'NT03',
          noteType: 'info', 
          icon: 'bi bi-info-lg',
          text: ''
        },
        icons: [
          { value: 'info', label: 'Инфо', icon: 'bi bi-info-lg' },
          { value: 'warning', label: 'Warning', icon: 'bi bi-lightbulb' },
          { value: 'explanation', label: 'Объяснение', icon: 'bi bi-exclamation-circle' }
        ]
      },
    ],
  },
  {
    type: 'tabs',
    label: 'Вкладки',
    icon: 'tabs',
    subvariants: [
      {
        id: 'TS01',
        name: 'TS01',
        title: 'Секция с табами (горизонтальные)',
        description: 'Блок с несколькими табами расположенными горизонтально. В каждый таб можно добавлять блоки: текст, изображения, кнопки и т.д.',
        preview: '/previews/ts01.bmp',
        defaultContent: {
          tabs: [
            {
              id: `tab-${Date.now()}-1`,
              title: 'Таб 1',
              children: []
            },
            {
              id: `tab-${Date.now()}-2`,
              title: 'Таб 2',
              children: []
            }
          ]
        },
      },
      {
        id: 'TS02',
        name: 'TS02',
        title: 'Секция с табами (вертикальные)',
        description: 'Блок с несколькими табами расположенными вертикально (один под другим). В каждый таб можно добавлять блоки: текст, изображения, кнопки и т.д.',
        preview: '/previews/ts02.bmp',
        defaultContent: {
          tabs: [
            {
              id: `tab-${Date.now()}-1`,
              title: 'Таб 1',
              children: []
            },
            {
              id: `tab-${Date.now()}-2`,
              title: 'Таб 2',
              children: []
            }
          ]
        },
      },
    ],
  },
  {
    type: 'columns',
    label: 'Колонки',
    icon: 'columns',
    subvariants: [
      {
        id: 'CL01',
        name: 'CL01',
        title: 'Две колонки (два текста)',
        description: 'Две колонки, в каждой — редактор текста.',
        preview: '/previews/cl01.bmp',
        defaultContent: {
          columns: [
            { html: '' },
            { html: '' }
          ]
        },
      },
      {
        id: 'CL02',
        name: 'CL02',
        title: 'Две колонки: подзаголовок и текст',
        description: 'В первой колонке подзаголовок (h2), во второй — текст.',
        preview: '/previews/cl02.bmp',
        defaultContent: {
          columns: [
            { html: '', type: 'h2' },
            { html: '' }
          ]
        },
      },
      {
        id: 'CL03',
        name: 'CL03',
        title: 'Две колонки: текст и сноска',
        description: 'В первой колонке текст, во второй — текст меньшего размера (сноска).',
        preview: '/previews/cl03.bmp',
        defaultContent: {
          columns: [
            { html: '' },
            { html: '' }
          ]
        },
      },
      {
        id: 'CL04',
        name: 'CL04',
        title: 'Три колонки (три текста)',
        description: 'Три колонки, в каждой — редактор текста.',
        preview: '/previews/cl04.bmp',
        defaultContent: {
          columns: [
            { html: '' },
            { html: '' },
            { html: '' }
          ]
        },
      },
    ],
  },
  {
    type: 'image',
    label: 'Изображение',
    icon: 'image',
    subvariants: [
      {
        id: 'IM01',
        name: 'IM01',
        title: 'Одиночное изображение',
        description: 'Блок для одного изображения. Можно загрузить или вставить ссылку.',
        preview: '/previews/im01.bmp',
        defaultContent: { src: '', alt: '', variant: 'IM01', type: 'image' },
      },
      {
        id: 'IM02',
        name: 'IM02',
        title: 'Изображение с подписью внизу',
        description: 'Блок для изображения с подписью снизу. Можно загрузить изображение и добавить подпись.',
        preview: '/previews/im02.bmp',
        defaultContent: { src: '', alt: '', variant: 'IM02', type: 'image', caption: '' },
      },
      {
        id: 'IM03',
        name: 'IM03',
        title: 'Изображение с подписью справа',
        description: 'Блок для изображения с подписью справа. Можно загрузить изображение и добавить подпись.',
        preview: '/previews/im03.bmp',
        defaultContent: { src: '', alt: '', variant: 'IM03', type: 'image', caption: '' },
      },
      {
        id: 'IM04',
        name: 'IM04',
        title: 'Секция с изображением',
        description: 'Блок: текст (с заголовком или без) + изображение. Можно менять местами текст и картинку.',
        preview: '/previews/im04.bmp',
        defaultContent: {
          title: '',
          text: '',
          src: '', 
          alt: '',
          variant: 'IM04',
          type: 'image-section',
          reverse: false // если true - картинка слева, текст справа
        },
        settings: {
          allowTitle: true,
          allowText: true,
          allowReverse: true,
          allowUpload: true,
          allowUrl: true,
          maxImages: 1
        }
      }
    ]
  },
  {
    type: 'gallery',
    label: 'Галерея',
    icon: 'gallery',
    subvariants: [
      {
          id: 'GL01',
          name: 'GL01',
          title: 'Изображения в 2 колонки',
          description: '',
          preview: '/previews/gl01.bmp',
          defaultContent: {
            images: [],
            columns: 2,
            imageHeight: 240,
            galleryCaption: '',
          },
          settings: {
            allowUrl: true,
            allowUpload: true,
            allowReorder: true,
            allowDelete: true,
            allowImageHeight: true,
            allowGalleryCaption: true,
          }
        },
        {
          id: 'GL02',
          name: 'GL02',
          title: 'Изображения в 3 колонки',
          description: '',
          preview: '/previews/gl02.bmp',
          defaultContent: {
            images: [],
            columns: 3,
            imageHeight: 240,
            galleryCaption: '',
          },
          settings: {
            allowUrl: true,
            allowUpload: true,
            allowReorder: true,
            allowDelete: true,
            allowImageHeight: true,
            allowGalleryCaption: true,
          }
        },
        {
          id: 'GL03',
          name: 'GL03',
          title: 'Комбинация: большое и маленькое изображения',
          description: 'Два изображения: одно большое, одно маленькое. Нельзя задать высоту и ширину.',
          preview: '/previews/gl03.bmp',
          defaultContent: {
            images: [],
            galleryCaption: '',
            maxImages: 2,
          },
          settings: {
            allowUrl: true,
            allowUpload: true,
            allowReorder: true,
            allowDelete: true,
            allowImageHeight: false,
            allowGalleryCaption: true,
            maxImages: 2,
          }
        },
        {
          id: 'GL04',
          name: 'GL04',
          title: 'Комбинация: 2 изображения со смещением',
          description: 'Два изображения со смещением. Можно задать одну высоту для обоих изображений.',
          preview: '/previews/gl04.bmp',
          defaultContent: {
            images: [],
            imageHeight: 240,
            galleryCaption: '',
            maxImages: 2,
          },
          settings: {
            allowUrl: true,
            allowUpload: true,
            allowReorder: true,
            allowDelete: true,
            allowImageHeight: true,
            allowGalleryCaption: true,
            maxImages: 2,
          }
        },
        {
          id: 'GL05',
          name: 'GL05',
          title: 'Комбинация изображений',
          description: 'Комбинация изображений (как в вариантах 1 и 2). Можно загрузить до 5 изображений, задать подписи и одну высоту.',
          preview: '/previews/gl05.bmp',
          defaultContent: {
            images: [],
            columns: 2,
            imageHeight: 240,
            galleryCaption: '',
          },
          settings: {
            allowUrl: true,
            allowUpload: true,
            allowReorder: true,
            allowDelete: true,
            allowImageHeight: false,
            allowGalleryCaption: true,
          }
        },
        {
          id: 'GL06',
          name: 'GL06',
          title: 'Комбинация вертикальных и горизонтальных',
          description: 'Комбинация вертикальных и горизонтальных изображений. Можно загрузить до 5 изображений, задать подписи и одну высоту.',
          preview: '/previews/gl06.bmp',
          defaultContent: {
            images: [],
            columns: 2,
            imageHeight: 240,
            galleryCaption: '',
          },
          settings: {
            allowUrl: true,
            allowUpload: true,
            allowReorder: true,
            allowDelete: true,
            allowImageHeight: true,
            allowGalleryCaption: true,
          }
        }
    ]
  },
  {
    type: 'tile-link',
    label: 'Плитка и ссылка',
    icon: 'link-45deg',
    subvariants: [
      {
        id: 'TL01',
        name: 'TL01',
        title: 'Изображение-ссылка',
        description: 'Одно изображение, которое является ссылкой.',
        preview: '/previews/tl01.bmp',
        defaultContent: {
          src: '',
          alt: '',
          width: 800,
          height: 600,
          alignH: 'center',
          url: '',
          pdfUrl: '',
          linkType: 'url',
          openInNewTab: true,
        },
      },
      {
        id: 'TL02',
        name: 'TL02',
        title: 'Галерея изображений-ссылок',
        description: 'Несколько изображений, каждое с собственной ссылкой.',
        preview: '/previews/tl02.bmp',
        defaultContent: {
          items: [],
          columns: 3,
          imageHeight: 240,
        },
        settings: {
          maxItems: 12,
        }
      }
    ]
  },
  {
    type: 'table',
    label: 'Таблица',
    icon: 'table',
    subvariants: [
      {
        id: 'TB01',
        name: 'TB01',
        title: 'Таблица с заголовками',
        description: 'Таблица с заголовками колонок в первой строке.',
        preview: '/previews/tb01.bmp',
        defaultContent: {
          hasHeaders: true,
          rows: [
            ['Заголовок 1', 'Заголовок 2', 'Заголовок 3'],
            ['Ячейка 1-1', 'Ячейка 1-2', 'Ячейка 1-3'],
            ['Ячейка 2-1', 'Ячейка 2-2', 'Ячейка 2-3'],
          ],
        },
      },
      {
        id: 'TB02',
        name: 'TB02',
        title: 'Таблица без заголовков',
        description: 'Простая таблица без отдельных заголовков.',
        preview: '/previews/tb02.bmp',
        defaultContent: {
          hasHeaders: false,
          rows: [
            ['Ячейка 1-1', 'Ячейка 1-2', 'Ячейка 1-3'],
            ['Ячейка 2-1', 'Ячейка 2-2', 'Ячейка 2-3'],
            ['Ячейка 3-1', 'Ячейка 3-2', 'Ячейка 3-3'],
          ],
        },
      },
    ],
  },
];