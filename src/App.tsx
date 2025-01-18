import { useState, useMemo, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import fm from 'front-matter';

import {
  BookOpen,
  GitGraph,
  LayoutGrid,
  List,
  Film,
  Music,
  Tv,
  BookMarked,
  PlaySquare,
  Globe,
  ChevronDown,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

// 表示モードの型
type ViewMode = 'card' | 'tree' | 'graph';

// メディア種別
type MediaType = 'book' | 'movie' | 'drama' | 'manga' | 'anime' | 'music' | 'zeitgeist';

// メディアアイテムの型定義
interface MediaItem {
  id: string;
  type: MediaType;
  title: string;
  creator: string;
  year: string;
  importance: number;  // 今回は使わないが、型定義として残しておく
  notes: string;       // Markdown本文
  imageUrl: string;
}

// メディア種別ごとのアイコン
const mediaTypeIcons: Record<MediaType, React.FC<React.SVGProps<SVGSVGElement>>> = {
  book: BookOpen,
  movie: Film,
  drama: Tv,
  manga: BookMarked,
  anime: PlaySquare,
  music: Music,
  zeitgeist: Globe,
};

// メディア種別ラベル
const mediaTypeLabels: Record<MediaType, string> = {
  book: '本',
  movie: '映画',
  drama: 'ドラマ',
  manga: '漫画',
  anime: 'アニメ',
  music: '音楽',
  zeitgeist: '時世',
};

// Vite 機能で ./contents/**/*.md を文字列として取得
const markdownFiles = import.meta.glob('./contents/**/*.md', {
  import: 'default',
  query: '?raw',
});

/* --------------------------------
   一覧表示: カード
   星を削除し、改行を活かして2行制限
-------------------------------- */
function MediaItemCard({
  item,
  onClick,
}: {
  item: MediaItem;
  onClick?: () => void;
}) {
  const Icon = mediaTypeIcons[item.type];
  return (
    <Card
      onClick={onClick}
      className="overflow-hidden hover:shadow-lg transition-shadow group cursor-pointer"
    >
      <div className="aspect-[3/4] relative">
        <img
          src={item.imageUrl}
          alt={item.title}
          className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />
        <div className="absolute top-2 right-2">
          <div className="bg-white/90 p-1.5 rounded-full">
            <Icon className="h-4 w-4 text-amber-700" />
          </div>
        </div>
        <div className="absolute bottom-0 p-3 text-white">
          <h3 className="text-base font-medium leading-tight">{item.title}</h3>
          <p className="text-xs opacity-90 mt-0.5">{item.creator}</p>
        </div>
      </div>
      <div className="p-3 bg-white">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-amber-700">{item.year}年</span>
        </div>
        {/* 改行を活かして2行までに制限 */}
        <p className="text-xs text-gray-600 line-clamp-2 whitespace-pre-wrap break-words">
          {item.notes}
        </p>
      </div>
    </Card>
  );
}

function CreatorSection({
  creator,
  items,
  onItemClick,
}: {
  creator: string;
  items: MediaItem[];
  onItemClick: (item: MediaItem) => void;
}) {
  const [isOpen, setIsOpen] = useState(true);
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <button className="flex items-center w-full py-2 px-4 bg-white/80 backdrop-blur-sm rounded-lg mb-4 group">
          <ChevronDown
            className={cn(
              "h-4 w-4 text-amber-700 transition-transform mr-2",
              isOpen && "rotate-180"
            )}
          />
          <h2 className="text-lg font-serif text-amber-950">{creator}</h2>
          <span className="text-sm text-amber-700/70 ml-3">({items.length}作品)</span>
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-6">
          {items.map((item) => (
            <MediaItemCard
              key={item.id}
              item={item}
              onClick={() => onItemClick(item)}
            />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

/* -----------------------------
   詳細表示ページ
----------------------------- */
function DetailPage({
  item,
  onBack,
}: {
  item: MediaItem;
  onBack: () => void;
}) {
  return (
    <div className="prose prose-sm max-w-none w-full text-gray-800">
      <Button variant="outline" onClick={onBack} className="mb-4">
        ← 戻る
      </Button>

      <h2 className="text-xl font-bold">
        {item.title} <span className="text-sm text-gray-500">({item.year})</span>
      </h2>
      <p className="text-sm text-gray-700 mb-4"> {item.creator}</p>

      {/* Markdown のリッチ表示 */}
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {item.notes}
      </ReactMarkdown>
    </div>
  );
}

/* -----------------------------
   ツリー表示: TreeView
----------------------------- */
function TreeView({ items, onSelect }: { items: MediaItem[], onSelect: (item: MediaItem) => void }) {
  // type -> creator -> items
  const groupedByType = useMemo(() => {
    const map: Record<string, MediaItem[]> = {};
    for (const it of items) {
      const t = it.type;
      if (!map[t]) map[t] = [];
      map[t].push(it);
    }
    return map;
  }, [items]);

  return (
    <div className="bg-white/80 rounded-lg p-6 backdrop-blur-sm">
      <h2 className="text-lg font-bold mb-4 text-amber-950">ツリー表示</h2>
      <ul className="list-disc list-inside space-y-4">
        {Object.entries(groupedByType).map(([typeKey, typeItems]) => {
          // creator -> items
          const groupedByCreator = typeItems.reduce<Record<string, MediaItem[]>>((acc, curr) => {
            if (!acc[curr.creator]) {
              acc[curr.creator] = [];
            }
            acc[curr.creator].push(curr);
            return acc;
          }, {});

          return (
            <li key={typeKey}>
              <span className="font-semibold text-amber-700">
                {mediaTypeLabels[typeKey as MediaType] ?? typeKey}
              </span>
              <ul className="list-decimal list-inside ml-5 mt-1 space-y-2">
                {Object.entries(groupedByCreator).map(([creator, cItems]) => (
                  <li key={creator}>
                    <span className="text-amber-950 font-semibold">
                      {creator}
                    </span>
                    <ul className="list-[circle] ml-5 mt-1 space-y-1">
                      {cItems.map((itm) => (
                        <li
                          key={itm.id}
                          onClick={() => onSelect(itm)}
                          className="cursor-pointer hover:underline text-sm text-gray-700"
                        >
                          {itm.title} ({itm.year})
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* -----------------------------
   グラフ表示: GraphView
   -> すべての .md (MediaItem) をノードに
----------------------------- */
function GraphView({ items, onSelect }: { items: MediaItem[], onSelect: (item: MediaItem) => void }) {

  function getTypeColor(type: MediaType) {
    switch (type) {
      case 'book': return 'bg-lime-100';
      case 'movie': return 'bg-pink-100';
      case 'drama': return 'bg-blue-100';
      case 'manga': return 'bg-purple-100';
      case 'anime': return 'bg-orange-100';
      case 'music': return 'bg-yellow-100';
      case 'zeitgeist': return 'bg-teal-100';
      default: return 'bg-gray-100';
    }
  }

  return (
    <div className="bg-white/80 rounded-lg p-6 backdrop-blur-sm">
      <h2 className="text-lg font-bold mb-4 text-amber-950">グラフ表示</h2>
      <p className="text-sm text-gray-600 mb-2">
        簡易実装。
      </p>

      <div className="flex flex-wrap gap-4 justify-center">
        {items.map((itm) => {
          const colorClass = getTypeColor(itm.type);
          return (
            <div
              key={itm.id}
              className={cn(
                "w-32 h-32 rounded-full flex items-center justify-center text-center cursor-pointer shadow-md hover:shadow-lg relative p-2",
                colorClass
              )}
              onClick={() => onSelect(itm)}
            >
              <div className="text-sm text-amber-950 px-2">
                <span className="font-semibold block mb-1">{mediaTypeLabels[itm.type]}</span>
                <span className="font-medium">{itm.title}</span>
                <span className="block text-xs text-gray-600 mt-1">{itm.creator}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* -----------------------------
   メインコンポーネント App
----------------------------- */
function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('card');
  const [selectedType, setSelectedType] = useState<MediaType | 'all'>('all');
  const [items, setItems] = useState<MediaItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);

  // Markdown 読み込み
  useEffect(() => {
    const loadMarkdownFiles = async () => {
      const loadedItems: MediaItem[] = [];
      const filePaths = Object.keys(markdownFiles);

      for (const filePath of filePaths) {
        // `rawContent` が unknown 型の場合、String(...) で文字列化
        const rawContent = await markdownFiles[filePath]();
        const parsed = fm(String(rawContent)); 
        const data: any = parsed.attributes;
        const body = parsed.body;

        if (!data.type || !data.title || !data.creator) {
          console.warn("Skipping: missing fields at", filePath, data);
          continue;
        }

        loadedItems.push({
          id: filePath,
          type: data.type,
          title: data.title,
          creator: data.creator,
          year: data.year || "",
          importance: data.importance || 3,
          imageUrl: data.imageUrl || "",
          notes: body || "",
        });
      }

      setItems(loadedItems);
    };

    loadMarkdownFiles();
  }, []);

  // フィルタ (MediaType)
  const filteredItems = selectedType === 'all'
    ? items
    : items.filter(item => item.type === selectedType);

  // 作者ごとにグルーピング & ソート (カード表示で使用)
  const groupedByCreator = useMemo(() => {
    const groups: Record<string, MediaItem[]> = {};
    filteredItems.forEach(item => {
      if (!groups[item.creator]) groups[item.creator] = [];
      groups[item.creator].push(item);
    });
    return Object.entries(groups).sort(([aName, aItems], [bName, bItems]) => {
      const diff = bItems.length - aItems.length;
      return diff !== 0 ? diff : aName.localeCompare(bName);
    });
  }, [filteredItems]);

  return (
    <div className="min-h-screen bg-[#faf7f2]">
      {/* ヘッダー */}
      <header className="border-b bg-white/50 backdrop-blur-sm fixed top-0 w-full z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BookOpen className="h-6 w-6 text-amber-700" />
            <h1 className="text-2xl font-serif text-amber-950">Osusume</h1>
          </div>
          <div className="flex items-center space-x-4">
            {/* ドロップダウン: MediaType フィルタ */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="bg-white/50">
                  {selectedType === 'all' ? 'すべて' : mediaTypeLabels[selectedType]}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setSelectedType('all')}>
                  すべて
                </DropdownMenuItem>
                {Object.entries(mediaTypeLabels).map(([type, label]) => {
                  const Icon = mediaTypeIcons[type as MediaType];
                  return (
                    <DropdownMenuItem
                      key={type}
                      onClick={() => setSelectedType(type as MediaType)}
                    >
                      <Icon className="mr-2 h-4 w-4" />
                      {label}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* タブ: card/tree/graph */}
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
              <TabsList className="bg-white/50">
                <TabsTrigger value="card" className="data-[state=active]:bg-amber-50">
                  <LayoutGrid className="h-4 w-4 mr-1" />
                  カード
                </TabsTrigger>
                <TabsTrigger value="tree" className="data-[state=active]:bg-amber-50">
                  <List className="h-4 w-4 mr-1" />
                  ツリー
                </TabsTrigger>
                <TabsTrigger value="graph" className="data-[state=active]:bg-amber-50">
                  <GitGraph className="h-4 w-4 mr-1" />
                  グラフ
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </header>

      {/* メイン表示: 詳細 or 一覧 */}
      <main className="max-w-7xl mx-auto px-4 pt-24 pb-12">
        {selectedItem ? (
          /* 詳細ページ */
          <DetailPage
            item={selectedItem}
            onBack={() => setSelectedItem(null)}
          />
        ) : (
          /* 各表示モード */
          <>
            {viewMode === 'card' && (
              <div className="space-y-6">
                {groupedByCreator.map(([creator, creatorItems]) => (
                  <CreatorSection
                    key={creator}
                    creator={creator}
                    items={creatorItems}
                    onItemClick={(itm) => setSelectedItem(itm)}
                  />
                ))}
              </div>
            )}

            {viewMode === 'tree' && (
              <TreeView
                items={filteredItems}
                onSelect={(itm) => setSelectedItem(itm)}
              />
            )}

            {viewMode === 'graph' && (
              <GraphView
                items={filteredItems}
                onSelect={(itm) => setSelectedItem(itm)}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default App;
