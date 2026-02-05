
import React from 'react';
import { Vendor } from '../types';
import { ArrowLeft, Check, Sparkles, Mail, Phone, ExternalLink, MessageCircle } from 'lucide-react';

interface ClientServicePreviewProps {
    vendor: Vendor;
    onBack: () => void;
}

const ClientServicePreview: React.FC<ClientServicePreviewProps> = ({ vendor, onBack }) => {
    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900">

            {/* Brand Header */}
            <header className="bg-white border-b border-slate-100 py-4 px-6 sticky top-0 z-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                        <Sparkles size={18} />
                    </div>
                    <h1 className="font-bold text-lg text-slate-800 tracking-tight">街趣 <span className="text-indigo-600">BLOCK&</span></h1>
                </div>
                <button onClick={onBack} className="text-xs font-bold text-slate-400 hover:text-slate-600 flex items-center gap-1">
                    <ArrowLeft size={14} /> 關閉預覽
                </button>
            </header>

            <div className="max-w-4xl mx-auto p-6 md:p-12">

                {/* Main Content */}
                <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">

                    {/* Hero Section */}
                    <div className="p-8 md:p-12 border-b border-slate-100 bg-gradient-to-b from-indigo-50/50 to-white">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold mb-4 border border-indigo-200">
                            <Check size={12} /> 街趣嚴選合作夥伴
                        </div>
                        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">{vendor.name}</h1>
                        <p className="text-lg text-slate-600 leading-relaxed max-w-2xl">{vendor.description || "提供專業的活動服務，致力於創造美好體驗。"}</p>
                    </div>

                    {/* Images Grid */}
                    {vendor.serviceImages && vendor.serviceImages.length > 0 && (
                        <div className="p-8 border-b border-slate-100">
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">服務實景 Gallery</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {vendor.serviceImages.map((img, idx) => {
                                    const isVideo = img.startsWith('data:video');
                                    return isVideo ? (
                                        <video key={idx} src={img} className="w-full aspect-video rounded-2xl bg-slate-950 shadow-inner object-cover" controls playsInline />
                                    ) : (
                                        <div key={idx} className="aspect-video rounded-2xl bg-slate-100 bg-cover bg-center shadow-inner" style={{ backgroundImage: `url('${img}')` }}></div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Pricing Section (Client Facing Only) */}
                    <div className="p-8 md:p-12 bg-slate-50">
                        <div className="flex flex-col md:flex-row gap-8 items-start justify-between">
                            <div className="flex-1">
                                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">方案與價格 Pricing</h3>
                                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                    {vendor.clientPricingTerms ? (
                                        <div className="whitespace-pre-wrap text-slate-800 leading-relaxed font-medium">
                                            {vendor.clientPricingTerms}
                                        </div>
                                    ) : (
                                        <div className="text-slate-400 text-sm italic">請聯繫街趣專員獲取詳細報價。</div>
                                    )}
                                </div>
                            </div>

                            {/* Contact CTA */}
                            <div className="w-full md:w-80 bg-slate-900 text-white p-6 rounded-2xl shadow-xl shadow-slate-900/10">
                                <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Sparkles size={18} className="text-yellow-400" /> 預約此服務</h3>
                                <p className="text-sm text-slate-400 mb-6 leading-relaxed">喜歡這個方案嗎？請立即聯繫您的街趣活動顧問，我們將為您安排檔期。</p>
                                <div className="space-y-3">
                                    <a
                                        href="https://lin.ee/oFeTqBS"
                                        target="_blank"
                                        rel="noreferrer"
                                        className="w-full py-3 bg-[#06C755] hover:bg-[#05b34c] text-white rounded-xl font-bold transition-colors text-sm flex items-center justify-center gap-2"
                                    >
                                        <MessageCircle size={16} /> Line@ 諮詢
                                    </a>
                                    <div className="text-center text-xs text-slate-500">或是 Email 至 ksblock@daoteng.org</div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>

                <div className="mt-8 text-center text-slate-400 text-xs font-medium">
                    Powered by BLOCK& Ops Control • {new Date().getFullYear()}
                </div>
            </div>
        </div>
    );
};

export default ClientServicePreview;
