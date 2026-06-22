'use client';

import { useEffect, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowLineRight, ArrowCounterClockwise } from '@phosphor-icons/react';
import { widgetMetadata, WidgetIdType } from '../utils';
import Checkbox from '@/ui/checkbox';
import MiniBtn from '@/ui/mini-btn';

interface WidgetSettingsPanelProps {
  hiddenWidgets: WidgetIdType[];
  onToggleWidget: (widgetId: WidgetIdType) => void;
  onReset: () => void;
  onClose: () => void;
}

const WidgetSettingsPanel = ({
  hiddenWidgets,
  onToggleWidget,
  onReset,
  onClose,
}: WidgetSettingsPanelProps) => {
  const t = useTranslations('dashboard.widgetSettings');
  const tDashboard = useTranslations('dashboard');
  const [isVisible, setIsVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(true);

  const handleClose = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => {
      setShouldRender(false);
      onClose();
    }, 200);
  }, [onClose]);

  useEffect(() => {
    const originalStyle = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    requestAnimationFrame(() => {
      setIsVisible(true);
    });

    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleClose]);

  if (!shouldRender) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-bl/50 transition-opacity duration-200 z-40"
        role="button"
        tabIndex={0}
        onClick={handleClose}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') handleClose();
        }}
        style={{ opacity: isVisible ? 1 : 0 }}
      />

      {/* Panel */}
      <div
        className={`fixed top-0 right-0 h-full transition-transform duration-200 ease-in-out z-40 ${
          isVisible ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="w-[360px] bg-wh h-full flex flex-col shadow-[-4px_0_24px_rgba(0,0,0,0.08)]">
          {/* Header */}
          <div className="flex justify-between items-center px-6 py-4 border-b border-lg">
            <div className="flex gap-2 items-center">
              <h3 className="Heading-3">{t('title')}</h3>
              <button
                onClick={handleClose}
                className="flex items-center justify-center w-10 h-10 cursor-pointer hover:bg-bg rounded-lg transition-all duration-200"
              >
                <ArrowLineRight size={20} className="text-sv" />
              </button>
            </div>
            <MiniBtn
              text={t('reset')}
              icon={ArrowCounterClockwise}
              variant="outline"
              onClick={onReset}
            />
          </div>

          {/* Widget List */}
          <div className="flex-1 overflow-y-auto px-4 py-4">
            <div className="flex flex-col gap-2">
              {widgetMetadata.map((widget) => {
                const IconComponent = widget.icon;
                const isChecked = !hiddenWidgets.includes(widget.id);

                return (
                  <div
                    key={widget.id}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-bg transition-colors duration-200 cursor-pointer"
                    onClick={() => onToggleWidget(widget.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onToggleWidget(widget.id);
                      }
                    }}
                  >
                    {/* Icon Preview */}
                    <div className="w-12 h-12 rounded-lg bg-bg flex items-center justify-center flex-shrink-0">
                      <IconComponent
                        size={24}
                        className={isChecked ? 'text-primary' : 'text-sv'}
                      />
                    </div>

                    {/* Label */}
                    <span
                      className={`flex-1 Me_Body-3 ${isChecked ? 'text-dg' : 'text-sv'}`}
                    >
                      {tDashboard(widget.labelKey)}
                    </span>

                    {/* Checkbox */}
                    <Checkbox
                      isChecked={isChecked}
                      onToggle={() => onToggleWidget(widget.id)}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default WidgetSettingsPanel;
