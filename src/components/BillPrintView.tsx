import React from 'react';
import type { Bill } from '../types/bill';
import { computeWordDiff } from '../services/diffService';

interface BillPrintViewProps {
  bill: Bill;
}

export const BillPrintView: React.FC<BillPrintViewProps> = ({ bill }) => {
  const decreeStamp = bill.id ? `АКТ № SA-${bill.id.replace(/\D/g, '').slice(-4) || '0042'}` : '';

  return (
    <div id="bill-print-view" className="p-10 font-sans max-w-4xl mx-auto" style={{ width: '800px', minHeight: '1120px', backgroundColor: '#ffffff', color: '#000000' }}>
      
      {/* Header section */}
      <div className="text-center mb-8 border-b-2 pb-6" style={{ borderColor: "#000000" }}>
        <h1 className="text-3xl font-extrabold mb-2 uppercase tracking-wide">
          Государственный Реестр San Andreas
        </h1>
        <h2 className="text-xl font-bold" style={{ color: "#374151" }}>
          Законопроект {decreeStamp}
        </h2>
      </div>

      {/* Meta Info */}
      <div className="mb-8 space-y-2 text-sm">
        <p><strong>Название:</strong> {bill.targetLaw || bill.title}</p>
        <p><strong>Автор:</strong> {bill.author} ({bill.authorRole})</p>
        <p><strong>Дата создания:</strong> {new Date(bill.createdAt).toLocaleDateString('ru-RU')}</p>
        {bill.status === 'approved' && bill.federalVerdict && (
          <p><strong>Дата вступления в силу:</strong> {new Date(bill.federalVerdict.updatedAt).toLocaleDateString('ru-RU')}</p>
        )}
        {bill.federalVerdict && (
          <div className="p-3 my-2 border rounded text-sm" style={{ borderColor: "#d1d5db", background: "#f9fafb" }}>
            <p><strong>Решение Федерального Правительства:</strong> {
              bill.federalVerdict.status === 'approved'
                ? 'ОДОБРЕНО'
                : bill.federalVerdict.status === 'needs_revision'
                ? 'ОТПРАВЛЕНО НА ДОРАБОТКУ (ПРАВКИ)'
                : 'ОТКЛОНЕНО'
            }</p>
            {bill.federalVerdict.reason && (
              <p className="mt-1"><strong>Обоснование / Указания:</strong> {bill.federalVerdict.reason}</p>
            )}
            <p className="text-xs mt-1" style={{ color: "#6b7280" }}>
              Уполномоченный: {bill.federalVerdict.adminName || 'Федеральное Правительство'} ({new Date(bill.federalVerdict.updatedAt).toLocaleDateString('ru-RU')})
            </p>
          </div>
        )}
      </div>

      {/* Explanatory Note */}
      {bill.explanatoryNote && (
        <div className="mb-8">
          <h3 className="text-lg font-bold border-b pb-2 mb-4" style={{ borderColor: "#d1d5db" }}>Пояснительная записка</h3>
          <p className="text-sm whitespace-pre-wrap">{bill.explanatoryNote}</p>
        </div>
      )}

      {/* Articles / Comparisons */}
      <div className="mb-8">
        <h3 className="text-lg font-bold border-b pb-2 mb-6" style={{ borderColor: "#d1d5db" }}>Изменения (Протокол)</h3>
        
        {bill.comparisons.map((comp, idx) => {
          const diffResult = computeWordDiff(comp.wasContent, comp.becameContent, true);
          
          return (
            <div key={comp.id} className="mb-8 page-break-inside-avoid">
              <h4 className="font-bold text-md mb-3">{idx + 1}. {comp.articleTitle}</h4>
              
              <div className="p-4 rounded-sm border" style={{ backgroundColor: "#f9fafb", borderColor: "#e5e7eb" }}>
                <div className="whitespace-pre-wrap text-sm leading-relaxed" style={{ color: "#000000" }}>
                  {diffResult.unifiedFormatted}
                </div>
              </div>
              
              {comp.notes && (
                <p className="mt-2 text-xs" style={{ color: "#4b5563" }}><em>Примечание: {comp.notes}</em></p>
              )}
            </div>
          );
        })}
      </div>

      {/* Attachments / Media in Print View */}
      {bill.attachments && bill.attachments.length > 0 && (
        <div className="mb-8 page-break-inside-avoid">
          <h3 className="text-lg font-bold border-b pb-2 mb-6" style={{ borderColor: "#d1d5db" }}>Приложения и фотоматериалы</h3>
          <div className="grid grid-cols-2 gap-4">
            {bill.attachments.map((att, idx) => (
              <div key={att.id || idx} className="border p-3 rounded-sm" style={{ borderColor: "#e5e7eb", backgroundColor: "#f9fafb" }}>
                <div className="text-xs font-bold mb-2 uppercase text-gray-500">Фотофиксация #{idx + 1}</div>
                <div className="flex gap-2">
                  {att.beforeUrl && (
                    <div className="flex-1">
                      <div className="text-[10px] text-red-600 font-bold mb-1">Было:</div>
                      <img src={att.beforeUrl} alt="Было" className="w-full h-32 object-contain border bg-white" />
                    </div>
                  )}
                  {att.afterUrl && (
                    <div className="flex-1">
                      <div className="text-[10px] text-green-600 font-bold mb-1">Стало:</div>
                      <img src={att.afterUrl} alt="Стало" className="w-full h-32 object-contain border bg-white" />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer Signatures */}
      <div className="mt-16 pt-8 border-t flex justify-between text-sm" style={{ borderColor: "#d1d5db" }}>
        <div>
          <p className="mb-8"><strong>Инициатор:</strong></p>
          <p>_________________________</p>
          <p className="text-xs mt-1" style={{ color: "#6b7280" }}>{bill.author}</p>
        </div>
        {bill.status === 'approved' && (
          <div>
            <p className="mb-8"><strong>Утверждено:</strong></p>
            <p>_________________________</p>
            <p className="text-xs mt-1" style={{ color: "#6b7280" }}>{bill.federalVerdict?.adminName || 'Федеральное Правительство'}</p>
          </div>
        )}
      </div>

    </div>
  );
};

