import React from 'react';
import { X, CheckSquare, Square, CheckCircle2 } from 'lucide-react';
import { KanaGroup, ScriptType } from '../../types/kana';
import { getGroupsForScript } from '../../utils/kanaUtils';

interface GroupSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  script: ScriptType;
  selectedGroupIds: string[];
  onChangeSelectedGroupIds: (ids: string[]) => void;
  language?: 'ru' | 'en';
}

export const GroupSelectorModal: React.FC<GroupSelectorModalProps> = ({
  isOpen,
  onClose,
  script,
  selectedGroupIds,
  onChangeSelectedGroupIds,
  language = 'en',
}) => {
  if (!isOpen) return null;

  const isEn = language === 'en';
  const allGroups = getGroupsForScript(script);

  const toggleGroup = (id: string) => {
    if (selectedGroupIds.includes(id)) {
      if (selectedGroupIds.length <= 1) return; // keep at least 1
      onChangeSelectedGroupIds(selectedGroupIds.filter((g) => g !== id));
    } else {
      onChangeSelectedGroupIds([...selectedGroupIds, id]);
    }
  };

  const selectAll = () => {
    onChangeSelectedGroupIds(allGroups.map((g) => g.id));
  };

  const selectBasicOnly = () => {
    const basicIds = allGroups
      .filter((g) => !g.tags || g.tags.length === 0)
      .map((g) => g.id);
    onChangeSelectedGroupIds(basicIds.length > 0 ? basicIds : allGroups.slice(0, 5).map((g) => g.id));
  };

  // Group by category tag
  const basicGroups = allGroups.filter((g) => !g.tags || g.tags.length === 0);
  const lookAlikeGroups = allGroups.filter((g) => g.tags?.includes('look-alike'));
  const dakutenGroups = allGroups.filter(
    (g) => g.tags?.includes('dakuten') && !g.tags?.includes('yoon')
  );
  const handakutenGroups = allGroups.filter(
    (g) => g.tags?.includes('handakuten') && !g.tags?.includes('yoon')
  );
  const yoonGroups = allGroups.filter((g) => g.tags?.includes('yoon'));
  const loanGroups = allGroups.filter((g) => g.tags?.includes('loan'));

  const renderSection = (title: string, groups: KanaGroup[]) => {
    if (groups.length === 0) return null;
    return (
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-2.5">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {title}
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
            {groups.length}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {groups.map((group) => {
            const isSelected = selectedGroupIds.includes(group.id);
            const kanaPreview = group.symbols.map((s) => s.kana).join(' ');

            return (
              <button
                key={group.id}
                onClick={() => toggleGroup(group.id)}
                className={`p-3 rounded-2xl border text-left transition flex items-center justify-between cursor-pointer ${
                  isSelected
                    ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/20 text-slate-900 dark:text-white'
                    : 'border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="min-w-0 pr-2">
                  <div className="text-xs font-bold truncate">{group.label}</div>
                  <div className="text-sm font-noto-sans font-black tracking-wide text-rose-500 mt-0.5 truncate">
                    {kanaPreview}
                  </div>
                </div>

                <div className="shrink-0 text-rose-500">
                  {isSelected ? (
                    <CheckSquare className="w-5 h-5 fill-rose-500 text-white" />
                  ) : (
                    <Square className="w-5 h-5 text-slate-300 dark:text-slate-700" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-pop">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              {isEn ? 'Select Kana Groups' : 'Выбор групп каны'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {isEn
                ? `Selected ${selectedGroupIds.length} of ${allGroups.length} groups`
                : `Выбрано ${selectedGroupIds.length} из ${allGroups.length} групп`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick action toolbar */}
        <div className="flex flex-wrap gap-2 py-3 border-b border-slate-100 dark:border-slate-800/80">
          <button
            onClick={selectAll}
            className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer"
          >
            {isEn ? 'Select all' : 'Выбрать все'}
          </button>
          <button
            onClick={selectBasicOnly}
            className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer"
          >
            {isEn ? 'Basic only' : 'Только основные'}
          </button>
        </div>

        {/* Scrollable group categories */}
        <div className="flex-1 overflow-y-auto py-4 pr-1">
          {renderSection(isEn ? 'Basic Rows (Gojūon)' : 'Основные строки (Годжуон)', basicGroups)}
          {renderSection(isEn ? 'Look-alike Sets (シ vs ツ, ソ vs ン)' : 'Похожие знаки (Look-alikes: シ vs ツ, ソ vs ン)', lookAlikeGroups)}
          {renderSection(isEn ? 'Dakuten (ガ, ザ, ダ, バ)' : 'Озвончённые (Dakuten: ガ, ザ, ダ, バ)', dakutenGroups)}
          {renderSection(isEn ? 'Handakuten (パ)' : 'Полуозвончённые (Handakuten: パ)', handakutenGroups)}
          {renderSection(isEn ? 'Combinations (Yōon: キャ, シャ, チャ)' : 'Сочетания (Yōon: キャ, シャ, チャ)', yoonGroups)}
          {renderSection(isEn ? 'Loan / Extended (ファ, ヴァ, ティ)' : 'Заимствованные звуки (Loan words: ファ, ヴァ, ティ)', loanGroups)}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs shadow-xs cursor-pointer"
          >
            {isEn ? `Apply (${selectedGroupIds.length} groups)` : `Применить (${selectedGroupIds.length} групп)`}
          </button>
        </div>
      </div>
    </div>
  );
};
