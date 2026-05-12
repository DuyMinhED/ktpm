import React, { useEffect, useState } from 'react';
import Dropdown from '../../../components/ui/Dropdown';

interface Medication {
  id: number;
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  intakeType: string;
}

interface PrescriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  isAddingNewMedicine: boolean;
  setIsAddingNewMedicine: React.Dispatch<React.SetStateAction<boolean>>;
  medications: Medication[];
  setMedications: React.Dispatch<React.SetStateAction<Medication[]>>;
  removeMedication: (id: number) => void;
  newMedForm: {
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    intakeType: string;
  };
  setNewMedForm: React.Dispatch<React.SetStateAction<{
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    intakeType: string;
  }>>;
  formErrors: {
    name: boolean;
    dosage: boolean;
    frequency: boolean;
    duration: boolean;
    intakeType: boolean;
  };
  setFormErrors: React.Dispatch<React.SetStateAction<{
    name: boolean;
    dosage: boolean;
    frequency: boolean;
    duration: boolean;
    intakeType: boolean;
  }>>;
  addMedicationToPrescription: () => void;
  isSaving: boolean;
  onSave: (prescriptionData: any) => Promise<void>;
  patients: any[];
  preSelectedPatientId?: string;
}

const PrescriptionModal: React.FC<PrescriptionModalProps> = ({
  isOpen,
  onClose,
  isAddingNewMedicine,
  setIsAddingNewMedicine,
  medications,
  setMedications,
  removeMedication,
  newMedForm,
  setNewMedForm,
  formErrors,
  setFormErrors,
  addMedicationToPrescription,
  isSaving,
  onSave,
  patients,
  preSelectedPatientId
}) => {
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [diagnosis, setDiagnosis] = useState('');
  const [note, setNote] = useState('');
  const [returnDate, setReturnDate] = useState('');
  useEffect(() => {
    if (isOpen) {
      setDiagnosis('');
      setNote('');
      setReturnDate('');
      setMedications([]);
      setFormErrors({ name: false, dosage: false, frequency: false, duration: false, intakeType: false });
      setNewMedForm({ name: '', dosage: '', frequency: '', duration: '', intakeType: '' });
      
      if (preSelectedPatientId) {
        setSelectedPatientId(preSelectedPatientId);
      } else if (patients && patients.length > 1) {
        setSelectedPatientId('');
      }
    }
  }, [isOpen]);
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && patients && patients.length === 1 && !selectedPatientId) {
      setSelectedPatientId(String(patients[0].id));
    }
  }, [isOpen, patients, selectedPatientId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]"
        onClick={() => {
          onClose();
          setIsAddingNewMedicine(false);
        }}
      ></div>

      <div className={`relative flex flex-col lg:flex-row h-fit max-h-[92vh] md:max-h-[85vh] transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] ${isAddingNewMedicine ? 'max-w-7xl w-full' : 'max-w-4xl w-full'} mx-2 md:mx-4`}>
        {/* Left Panel: Original Prescription UI */}
        <div className={`bg-white dark:bg-slate-900 rounded-2xl shadow-2xl flex flex-col flex-shrink-0 transition-all duration-700 overflow-hidden ${isAddingNewMedicine ? 'w-full lg:w-[65%]' : 'w-full'}`}>
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-8 py-5">
            <h2 className="text-[20px] font-medium text-slate-900 dark:text-white leading-tight">Kê đơn thuốc mới</h2>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-8 text-left custom-scrollbar bg-white dark:bg-slate-900">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 text-left">
                <label className="text-[15px] font-medium text-slate-500 dark:text-slate-400">Bệnh nhân</label>
                  <Dropdown 
                    options={patients.map(p => ({ label: p.fullName || p.name, value: p.id }))}
                    value={selectedPatientId}
                    onChange={(val: any) => {
                      setSelectedPatientId(String(val));
                    }}
                    className="w-full"
                  />
              </div>
              <div className="space-y-2 text-left">
                <label className="text-[15px] font-medium text-slate-500 dark:text-slate-400">Chẩn đoán hiện tại</label>
                <input 
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all text-slate-900 dark:text-white font-medium text-[15px]" 
                  value={diagnosis}
                  onChange={(e) => {
                    setDiagnosis(e.target.value);
                  }}
                  placeholder="Nhập chẩn đoán..."
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 text-left">
                  <span className="material-symbols-outlined text-primary">pill</span>
                  Danh sách loại thuốc
                </h3>
                <button
                  onClick={() => setIsAddingNewMedicine(true)}
                  className="flex items-center gap-1 text-sm font-bold text-primary hover:bg-primary/10 px-3 py-1.5 rounded-lg transition-colors active:scale-95"
                >
                  <span className="material-symbols-outlined text-sm">add_circle</span>
                  Thêm thuốc
                </button>
              </div>
              <div className="overflow-hidden border border-slate-100 dark:border-slate-800 rounded-xl shadow-sm bg-white dark:bg-slate-900/50">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 text-[14px] font-bold text-slate-500 dark:text-slate-400 tracking-wide">
                    <tr>
                      <th className="px-4 py-4">Tên thuốc & Hàm lượng</th>
                      <th className="px-4 py-4">Liều dùng</th>
                      <th className="px-4 py-4">Tần suất</th>
                      <th className="px-4 py-4">Thời gian</th>
                      <th className="px-4 py-4 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {medications.length > 0 ? medications.map((med) => (
                      <tr key={med.id} className="text-sm hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                        <td className="px-4 py-4 text-left">
                          <div className="font-medium text-slate-900 dark:text-white">{med.name}</div>
                          <p className="text-xs text-slate-400">{med.intakeType}</p>
                        </td>
                        <td className="px-4 py-4 text-slate-900 dark:text-white">{med.dosage}</td>
                        <td className="px-4 py-4 text-slate-900 dark:text-white">{med.frequency}</td>
                        <td className="px-4 py-4 font-medium text-slate-900 dark:text-white">{med.duration}</td>
                        <td className="px-4 py-4 text-right">
                          <button type="button" onClick={(e) => { e.stopPropagation(); removeMedication(med.id); }} className="p-1.5 text-slate-400 hover:text-red-500 transition-colors active:scale-90">
                            <span className="material-symbols-outlined text-[22px]">delete</span>
                          </button>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={5} className="px-4 py-10 text-center">
                          <div className="flex flex-col items-center justify-center gap-2 text-slate-400">
                            <span className="material-symbols-outlined text-3xl opacity-30">pending_actions</span>
                            <p className="text-sm font-medium italic">Chưa có thuốc nào được thêm</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
              <div className="space-y-3 text-left">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <span className="material-symbols-outlined text-slate-400 text-sm">edit_note</span>
                  Ghi chú dược sĩ/bệnh nhân
                </label>
                <textarea 
                  rows={3} 
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all resize-none text-slate-900 dark:text-white text-sm" 
                  placeholder="Nhập hướng dẫn sử dụng thuốc chi tiết..." 
                  value={note}
                  onChange={(e) => {
                    setNote(e.target.value);
                  }}
                />
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-primary/5 rounded-xl border border-primary/10">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary">event_repeat</span>
                    <div className="text-left">
                      <p className="text-sm font-bold text-slate-900 dark:text-white">Hẹn tái khám</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Tự động nhắc lịch cho bệnh nhân</p>
                    </div>
                  </div>
                  <input type="checkbox" defaultChecked className="w-5 h-5 rounded-lg border-primary text-primary focus:ring-primary" />
                </div>
                <div className="space-y-2">
                  <label className="text-[14px] font-semibold text-slate-500 dark:text-slate-400 tracking-wide">Ngày tái khám dự kiến</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">calendar_today</span>
                    <input 
                      type="date" 
                      className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all text-slate-900 dark:text-white font-medium" 
                      value={returnDate}
                      onChange={(e) => {
                        setReturnDate(e.target.value);
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="sticky bottom-0 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 px-6 py-4 flex items-center justify-end gap-3 z-10">
            <button onClick={onClose} className="px-6 py-2.5 rounded-lg font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">Hủy</button>
            <button
              onClick={() => onSave({
                patientId: Number(selectedPatientId),
                diagnosis,
                notes: note,
                items: medications.map(m => ({
                  medicationName: m.name,
                  dosage: m.dosage,
                  usageInstructions: `${m.frequency} | ${m.duration} | ${m.intakeType}`
                }))
              })}
              disabled={isSaving || !selectedPatientId || medications.length === 0 || !diagnosis}
              className="px-8 py-2.5 rounded-lg font-bold bg-primary text-slate-900 hover:shadow-lg hover:shadow-primary/20 transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-wait"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin"></div>
                  Đang lưu...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-lg">send</span>
                  Lưu &amp; Gửi
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Panel: Add Medicine */}
        {isAddingNewMedicine && (
          <div className="flex-1 mt-6 lg:mt-0 lg:ml-6 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right-10 md:slide-in-from-bottom-10 lg:slide-in-from-right-10 duration-700 relative w-full">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-8 py-5">
              <h3 className="text-[20px] font-medium text-slate-900 dark:text-white leading-tight">Thêm thuốc mới</h3>
            </div>
 
            <div className="p-8 space-y-6 flex-1 overflow-y-auto text-left custom-scrollbar bg-white dark:bg-slate-900">
              <div className="space-y-2 text-left">
                <label className="text-[15px] font-medium text-slate-500 dark:text-slate-400">Tên thuốc & Hàm lượng</label>
                <input type="text" placeholder="VD: Augmentin 1g" className={`w-full px-5 py-3.5 rounded-2xl border ${formErrors.name ? 'border-red-500 bg-red-50/50' : 'border-slate-200 dark:border-slate-700'} bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all text-slate-900 dark:text-white font-medium text-[15px] shadow-sm`} value={newMedForm.name} onChange={(e) => { setNewMedForm({ ...newMedForm, name: e.target.value }); setFormErrors({ ...formErrors, name: false }); }} />
                {formErrors.name && <p className="text-[10px] text-red-500 font-bold tracking-wider pl-1">Vui lòng nhập tên thuốc</p>}
              </div>
 
              <div className="space-y-2 text-left">
                <label className="text-[15px] font-medium text-slate-500 dark:text-slate-400">Hướng dẫn uống thuốc</label>
                <input type="text" placeholder="VD: Uống sau khi ăn sáng 30p" className={`w-full px-5 py-3.5 rounded-2xl border ${formErrors.intakeType ? 'border-red-500 bg-red-50/50' : 'border-slate-200 dark:border-slate-700'} bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all text-slate-900 dark:text-white font-medium text-[15px] shadow-sm`} value={newMedForm.intakeType} onChange={(e) => { setNewMedForm({ ...newMedForm, intakeType: e.target.value }); setFormErrors({ ...formErrors, intakeType: false }); }} />
                {formErrors.intakeType && <p className="text-[10px] text-red-500 font-bold tracking-wider pl-1">Vui lòng nhập hướng dẫn</p>}
              </div>
 
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2 text-left">
                  <label className="text-[15px] font-medium text-slate-500 dark:text-slate-400">Liều dùng</label>
                  <input type="text" placeholder="1 viên" className={`w-full px-5 py-3.5 rounded-2xl border ${formErrors.dosage ? 'border-red-500 bg-red-50/50' : 'border-slate-200 dark:border-slate-700'} bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all text-slate-900 dark:text-white font-medium text-[15px] shadow-sm`} value={newMedForm.dosage} onChange={(e) => { setNewMedForm({ ...newMedForm, dosage: e.target.value }); setFormErrors({ ...formErrors, dosage: false }); }} />
                  {formErrors.dosage && <p className="text-[10px] text-red-500 font-bold tracking-wider pl-1">Trống</p>}
                </div>
                <div className="space-y-2 text-left">
                  <label className="text-[15px] font-medium text-slate-500 dark:text-slate-400">Thời gian</label>
                  <input type="text" placeholder="7 ngày" className={`w-full px-5 py-3.5 rounded-2xl border ${formErrors.duration ? 'border-red-500 bg-red-50/50' : 'border-slate-200 dark:border-slate-700'} bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all text-slate-900 dark:text-white font-medium text-[15px] shadow-sm`} value={newMedForm.duration} onChange={(e) => { setNewMedForm({ ...newMedForm, duration: e.target.value }); setFormErrors({ ...formErrors, duration: false }); }} />
                  {formErrors.duration && <p className="text-[10px] text-red-500 font-bold tracking-wider pl-1">Trống</p>}
                </div>
              </div>
 
              <div className="space-y-2 text-left">
                <label className="text-[15px] font-medium text-slate-500 dark:text-slate-400">Tần suất dùng</label>
                <input type="text" placeholder="VD: Sáng 1, Trưa 1, Tối 1" className={`w-full px-5 py-3.5 rounded-2xl border ${formErrors.frequency ? 'border-red-500 bg-red-50/50' : 'border-slate-200 dark:border-slate-700'} bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all text-slate-900 dark:text-white font-medium text-[15px] shadow-sm`} value={newMedForm.frequency} onChange={(e) => { setNewMedForm({ ...newMedForm, frequency: e.target.value }); setFormErrors({ ...formErrors, frequency: false }); }} />
                {formErrors.frequency && <p className="text-[10px] text-red-500 font-bold tracking-wider pl-1">Vui lòng nhập tuần suất</p>}
              </div>
            </div>
 
            <div className="sticky bottom-0 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 px-6 py-4 flex items-center justify-end gap-3 z-10">
              <button 
                onClick={() => setIsAddingNewMedicine(false)}
                className="px-6 py-4 rounded-2xl font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                type="button"
              >
                Bỏ qua
              </button>
              <button onClick={addMedicationToPrescription} className="flex-1 py-4 bg-primary text-slate-900 rounded-2xl font-medium text-[15px] hover:shadow-lg hover:shadow-primary/20 transition-all active:scale-95 flex items-center justify-center gap-2 shadow-md">
                <span className="material-symbols-outlined text-[20px]">library_add</span>
                Lưu vào đơn thuốc
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default PrescriptionModal;
