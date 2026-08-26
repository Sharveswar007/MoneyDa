"use client";

import React, { useState, useEffect } from 'react';
import { XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { UploadCloud, CheckCircle2, Activity, Eye, Loader2, Sparkles, AlertTriangle, MoreVertical, Camera, EyeOff, Flame, Download, Calculator, X, ChevronDown, ChevronUp, Sun, Moon, ArrowUpDown, LayoutDashboard, Search, List, MessageSquare, User, Send, Check, ShieldAlert, TrendingUp } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const categoryColors: Record<string, string> = {
  'Rent/Mortgage': '#f97316', 'Housing': '#f97316',
  'Groceries': '#10b981', 'Food': '#10b981',
  'Insurance': '#3b82f6', 'Transport': '#8b5cf6',
  'Dining Out': '#f43f5e', 'Subscriptions': '#eab308',
  'Utilities': '#06b6d4', 'Bills': '#06b6d4',
  'Income': '#10b981', 'Other': '#525252',
};

export default function Dashboard() {
  // App State
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  
  // Router & UI State
  const [currentView, setCurrentView] = useState<'home'|'transactions'|'chat'|'receipt'|'history'|'profile'|'fraud'|'simulator'>('home');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [stealthMode, setStealthMode] = useState(false);
  const [activeModal, setActiveModal] = useState<{title: string, message: string} | null>(null);
  
  // Transaction State
  const [sortConfig, setSortConfig] = useState<{key: string, direction: 'asc'|'desc'} | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Chat State
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState<{role: 'user'|'ai', content: string}[]>([]);
  const [chatLoading, setChatLoading] = useState(false);

  // Profile Image State
  const [profileImage, setProfileImage] = useState<string | null>(null);

  // Receipt Scanner State
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);

  const [userName, setUserName] = useState("MoneyDa Hacker");
  const [isEditingName, setIsEditingName] = useState(false);
  const [preferredCurrency, setPreferredCurrency] = useState('INR');
  const currencySymbol = preferredCurrency === 'INR' ? '₹' : preferredCurrency === 'USD' ? '$' : preferredCurrency === 'EUR' ? '€' : '£';
  
  const [history, setHistory] = useState<any[]>([]);
  const [simYears, setSimYears] = useState(10);
  const [isGeneratingInvestLink, setIsGeneratingInvestLink] = useState(false);
  const [investLinkResult, setInvestLinkResult] = useState<string | null>(null);

  // LocalStorage Persistence & Theme Application
  useEffect(() => {
    const saved = localStorage.getItem('moneyda_cache');
    if (saved) {
      try { setAnalysisResult(JSON.parse(saved)); } catch (e) { console.error("Cache corrupted"); }
    }
    const savedTheme = localStorage.getItem('moneyda_theme') as 'dark' | 'light';
    if (savedTheme) { setTheme(savedTheme); }

    const savedProfileImg = localStorage.getItem('moneyda_profile_image');
    if (savedProfileImg) setProfileImage(savedProfileImg);

    const savedName = localStorage.getItem('moneyda_username');
    if (savedName) setUserName(savedName);

    const savedCurr = localStorage.getItem('moneyda_currency');
    if (savedCurr) setPreferredCurrency(savedCurr);

    const savedHist = localStorage.getItem('moneyda_history');
    if (savedHist) setHistory(JSON.parse(savedHist));
  }, []);

  useEffect(() => {
    const html = document.documentElement;
    if (theme === 'dark') {
      html.classList.add('dark');
      html.style.colorScheme = 'dark';
    } else {
      html.classList.remove('dark');
      html.style.colorScheme = 'light';
    }
  }, [theme]);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('moneyda_theme', newTheme);
  };

  // Upload Logic
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      let extractedName = file.name.split('.')[0].replace(/[-_]/g, ' ');
      extractedName = extractedName.charAt(0).toUpperCase() + extractedName.slice(1);
      setUserName(extractedName);
      localStorage.setItem('moneyda_username', extractedName);
      
      setFile(file);
      setLoading(true);
      const formData = new FormData();
      formData.append("file", file);

      try {
        const response = await fetch("/api/analyze", {
          method: "POST",
          body: formData,
        });
        const data = await response.json();
        setAnalysisResult(data);
        localStorage.setItem('moneyda_cache', JSON.stringify(data));
        
        // Save to History
        const newEntry = {
           id: Date.now(),
           filename: file.name,
           date: new Date().toISOString(),
           transactions: data.categorized.length,
           runway: data.predictions?.broke_date || 'Unknown',
           raw: data
        };
        const updatedHistory = [newEntry, ...history];
        setHistory(updatedHistory);
        localStorage.setItem('moneyda_history', JSON.stringify(updatedHistory));
      } catch (error) {
        alert("Failed to analyze file. Ensure the backend is running.");
      } finally {
        setLoading(false);
      }
    }
  };

  const clearCache = () => {
    localStorage.removeItem('moneyda_cache');
    setAnalysisResult(null);
    setCurrentView('home');
  };

  const handleLoadHistory = (h: any) => {
    if (h.raw) {
      setAnalysisResult(h.raw);
      localStorage.setItem('moneyda_cache', JSON.stringify(h.raw));
      setCurrentView('transactions');
    } else {
      alert("This is a legacy history entry. Please upload the CSV file again.");
    }
  };

  const formatAmount = (amount: number) => {
    const isExpense = amount < 0;
    const val = Math.abs(amount).toFixed(2);
    if (stealthMode) return isExpense ? `-${currencySymbol}***.**` : `+${currencySymbol}***.**`;
    return isExpense ? `-${currencySymbol}${val}` : `+${currencySymbol}${val}`;
  };

  // Profile Image Logic
  const handleProfileImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setProfileImage(base64);
        localStorage.setItem('moneyda_profile_image', base64);
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  // Receipt Scanner Logic
  const handleReceiptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const url = URL.createObjectURL(file);
      setReceiptImage(url);
      setIsScanning(true);
      setScanResult(null);

      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const base64 = reader.result;
        try {
          const res = await fetch('/api/scan_receipt', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: base64 })
          });
          const data = await res.json();
          setIsScanning(false);
          if (data.error) {
             alert(data.error);
          } else {
             try {
                const currency = data.currency || 'USD';
                const exRes = await fetch(`https://api.exchangerate-api.com/v4/latest/${currency}`);
                const exData = await exRes.json();
                const rate = exData.rates[preferredCurrency] || 1;
                const converted = data.amount * rate;
                setScanResult({ merchant: data.merchant, amount: converted.toFixed(2), date: data.date, originalCurrency: currency });
             } catch (e) {
                setScanResult({ merchant: data.merchant, amount: data.amount, date: data.date, originalCurrency: data.currency || 'USD' });
             }
          }
        } catch (error) {
          setIsScanning(false);
          alert("Failed to scan receipt.");
        }
      };
    }
  };

  const handleAddToLedger = () => {
    if (!analysisResult || !scanResult) {
       alert("Please upload a CSV statement first to initialize your ledger.");
       return;
    }
    const newTx = {
      date: scanResult.date,
      description: scanResult.merchant,
      amount: -parseFloat(scanResult.amount),
      category: "Receipt",
      is_impulse: false,
      is_surge: false
    };
    const newResult = {
      ...analysisResult,
      categorized: [newTx, ...analysisResult.categorized]
    };
    setAnalysisResult(newResult);
    localStorage.setItem('moneyda_cache', JSON.stringify(newResult));
    setScanResult(null);
    setReceiptImage(null);
    setCurrentView('transactions');
  };

  // Profile Stats
  const getProfileStats = () => {
    if (!analysisResult) return { totalSpend: 0, topCategory: "N/A", avgTx: 0 };
    let total = 0;
    let catCounts: Record<string, number> = {};
    let expenseCount = 0;
    
    analysisResult.categorized.forEach((tx: any) => {
      const amt = typeof tx.amount === 'number' ? tx.amount : parseFloat(tx.amount || 0);
      if (amt < 0) {
        total += Math.abs(amt);
        expenseCount++;
        const cat = tx.category || "Other";
        catCounts[cat] = (catCounts[cat] || 0) + Math.abs(amt);
      }
    });
    
    let topCat = "N/A";
    let maxCatAmt = 0;
    Object.entries(catCounts).forEach(([cat, amt]) => {
      if (amt > maxCatAmt) {
        maxCatAmt = amt;
        topCat = cat;
      }
    });
    
    return {
      totalSpend: total,
      topCategory: topCat,
      avgTx: expenseCount > 0 ? total / expenseCount : 0
    };
  };

  // AI & Export Actions
  const handleRoast = async () => {
    setCurrentView('chat');
    setChatHistory(prev => [...prev, {role: 'user', content: "Roast my spending."}]);
    setChatLoading(true);
    try {
      const res = await fetch("/api/roast", { method: "POST" });
      const data = await res.json();
      setChatHistory(prev => [...prev, {role: 'ai', content: data.roast}]);
    } catch {
      setChatHistory(prev => [...prev, {role: 'ai', content: "Failed to connect to AI."}]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleDocument = async (action: string, desc: string, amount: number) => {
    const amtStr = formatAmount(amount);
    setActiveModal({ title: "Generating Document...", message: "AI is writing your personalized document..." });
    try {
      const res = await fetch("/api/generate_document", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, description: desc, amount: amtStr })
      });
      const data = await res.json();
      setActiveModal({ title: action === "dispute" ? "Formal Dispute Letter" : "Negotiation Script", message: data.document });
    } catch {
      setActiveModal({ title: "Error", message: "AI generation failed." });
    }
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !analysisResult) return;
    
    const userMsg = chatInput;
    setChatInput("");
    setChatHistory(prev => [...prev, {role: 'user', content: userMsg}]);
    setChatLoading(true);
    
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg, spending_data: analysisResult.categorized })
      });
      const data = await res.json();
      
      let aiContent = data.reply || "I didn't understand that.";
      const linkMatch = aiContent.match(/\[GENERATE_LINK:([\d.]+):(.*?)\]/);
      
      if (linkMatch) {
         const amount = linkMatch[1];
         const description = linkMatch[2];
         aiContent = aiContent.replace(linkMatch[0], "\n\n*Generating Razorpay Payment Link...*");
         setChatHistory(prev => [...prev, {role: 'ai', content: aiContent}]);
         
         try {
            const rzpRes = await fetch("/api/razorpay_link", {
               method: "POST",
               headers: { "Content-Type": "application/json" },
               body: JSON.stringify({ amount, description })
            });
            const rzpData = await rzpRes.json();
            if (rzpData.short_url) {
                setChatHistory(prev => {
                   const newHist = [...prev];
                   newHist[newHist.length - 1].content = aiContent.replace("*Generating Razorpay Payment Link...*", `**[Pay ₹${amount} for ${description}](${rzpData.short_url})**`);
                   return newHist;
                });
            } else {
                setChatHistory(prev => {
                   const newHist = [...prev];
                   newHist[newHist.length - 1].content = aiContent.replace("*Generating Razorpay Payment Link...*", `*Failed to generate link: ${rzpData.error}*`);
                   return newHist;
                });
            }
         } catch (e) {
             setChatHistory(prev => {
                   const newHist = [...prev];
                   newHist[newHist.length - 1].content = aiContent.replace("*Generating Razorpay Payment Link...*", `*Failed to generate link due to network error.*`);
                   return newHist;
             });
         }
      } else {
         setChatHistory(prev => [...prev, {role: 'ai', content: aiContent}]);
      }
    } catch {
      setChatHistory(prev => [...prev, {role: 'ai', content: "Error connecting to AI."}]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleExportExcel = () => {
    if (!analysisResult) return;
    const headers = ["Date", "Description", "Amount", "Category", "Impulse Buy", "Surge Pricing"];
    const rows = sortedFilteredTransactions.map((tx: any) => {
      const amount = typeof tx.amount === 'number' ? tx.amount : parseFloat(tx.amount || 0);
      return [`"${tx.date}"`, `"${tx.description || tx.desc || ''}"`, `"${amount}"`, `"${tx.category || 'Other'}"`, `"${tx.is_impulse ? 'YES' : 'NO'}"`, `"${tx.is_surge ? 'YES' : 'NO'}"`].join(",");
    });
    const csvString = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "moneyda_spend_analysis.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    window.print();
  };

  // Sorting & Filtering
  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const sortedFilteredTransactions = React.useMemo(() => {
    if (!analysisResult) return [];
    let sortable = [...analysisResult.categorized];
    
    if (searchQuery) {
      sortable = sortable.filter(tx => 
        (tx.description || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (tx.category || "").toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    if (sortConfig !== null) {
      sortable.sort((a, b) => {
        let aVal = a[sortConfig.key] || "";
        let bVal = b[sortConfig.key] || "";
        if (sortConfig.key === 'amount') {
           aVal = parseFloat(aVal || 0);
           bVal = parseFloat(bVal || 0);
        }
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortable;
  }, [analysisResult, sortConfig, searchQuery]);

  // Chart Data
  const getSpendingData = () => {
    if (!analysisResult) return [];
    const totals: Record<string, number> = {};
    analysisResult.categorized.forEach((tx: any) => {
      const amt = typeof tx.amount === 'number' ? tx.amount : parseFloat(tx.amount || 0);
      if (amt < 0) {
        const cat = tx.category || 'Other';
        totals[cat] = (totals[cat] || 0) + Math.abs(amt);
      }
    });
    return Object.entries(totals).map(([name, value]) => ({
      name, value, color: categoryColors[name] || '#525252'
    })).sort((a, b) => b.value - a.value);
  };

  const getBarData = () => {
    if (!analysisResult) return [];
    const grouped: Record<string, number> = {};
    analysisResult.categorized.forEach((tx: any) => {
      const amt = typeof tx.amount === 'number' ? tx.amount : parseFloat(tx.amount || 0);
      if (amt < 0) {
        let dateObj = new Date(tx.date);
        if (isNaN(dateObj.getTime())) dateObj = new Date();
        const month = dateObj.toLocaleString('default', { month: 'short', year: 'numeric' });
        grouped[month] = (grouped[month] || 0) + Math.abs(amt);
      }
    });
    return Object.entries(grouped).map(([month, value]) => ({ month, value: Math.round(value) }));
  };

  const getYearlyBarData = () => {
    if (!analysisResult) return [];
    const grouped: Record<string, number> = {};
    analysisResult.categorized.forEach((tx: any) => {
      const amt = typeof tx.amount === 'number' ? tx.amount : parseFloat(tx.amount || 0);
      if (amt < 0) {
        let dateObj = new Date(tx.date);
        if (isNaN(dateObj.getTime())) dateObj = new Date();
        const year = dateObj.getFullYear().toString();
        grouped[year] = (grouped[year] || 0) + Math.abs(amt);
      }
    });
    return Object.entries(grouped).map(([year, value]) => ({ year, value: Math.round(value) }));
  };

  const isDanger = analysisResult?.predictions?.daily_burn > 100;
  const stats = getProfileStats();

  // Render Helpers
  const renderNav = () => (
    <nav className="print:hidden h-16 border-b border-slate-200 dark:border-[#1a1a1a] bg-white dark:bg-[#050505] flex items-center justify-between px-8 sticky top-0 z-40 transition-colors duration-300">
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setCurrentView('home')}>
          <div className="w-4 h-8 bg-orange-500 rounded-sm shadow-[0_0_10px_rgba(249,115,22,0.4)]"></div>
          <span className="font-bold text-xl tracking-tight uppercase">MoneyDa</span>
        </div>
        
        <div className="hidden md:flex items-center gap-1">
          <button onClick={() => setCurrentView('home')} className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors ${currentView === 'home' ? 'bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-500' : 'text-slate-500 dark:text-neutral-400 hover:bg-slate-50 dark:hover:bg-[#111]'}`}>
            <LayoutDashboard size={16}/> Home
          </button>
          <button onClick={() => setCurrentView('transactions')} className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors ${currentView === 'transactions' ? 'bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-500' : 'text-slate-500 dark:text-neutral-400 hover:bg-slate-50 dark:hover:bg-[#111]'}`}>
            <List size={16}/> Ledger
          </button>
          <button onClick={() => setCurrentView('chat')} className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors ${currentView === 'chat' ? 'bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-500' : 'text-slate-500 dark:text-neutral-400 hover:bg-slate-50 dark:hover:bg-[#111]'}`}>
            <MessageSquare size={16}/> AI Chat
          </button>
          <button onClick={() => setCurrentView('receipt')} className={`flex items-center gap-2 px-3 py-2 rounded-lg font-semibold text-sm transition-all ${currentView === 'receipt' ? 'bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400' : 'text-slate-600 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-[#1a1a1a] hover:text-slate-900 dark:hover:text-white'}`}>
            <Camera size={16} /> Scanner
          </button>
          <button onClick={() => setCurrentView('fraud')} className={`flex items-center gap-2 px-3 py-2 rounded-lg font-semibold text-sm transition-all ${currentView === 'fraud' ? 'bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400' : 'text-slate-600 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-[#1a1a1a] hover:text-slate-900 dark:hover:text-white'}`}>
            <ShieldAlert size={16} /> Detective
          </button>
          <button onClick={() => setCurrentView('simulator')} className={`flex items-center gap-2 px-3 py-2 rounded-lg font-semibold text-sm transition-all ${currentView === 'simulator' ? 'bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400' : 'text-slate-600 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-[#1a1a1a] hover:text-slate-900 dark:hover:text-white'}`}>
            <TrendingUp size={16} /> Simulator
          </button>
          <button onClick={() => setCurrentView('history')} className={`flex items-center gap-2 px-3 py-2 rounded-lg font-semibold text-sm transition-all ${currentView === 'history' ? 'bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400' : 'text-slate-600 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-[#1a1a1a] hover:text-slate-900 dark:hover:text-white'}`}>
            <List size={16} /> History
          </button>
          <button onClick={() => setCurrentView('profile')} className={`flex items-center gap-2 px-3 py-2 rounded-lg font-semibold text-sm transition-all ${currentView === 'profile' ? 'bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400' : 'text-slate-600 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-[#1a1a1a] hover:text-slate-900 dark:hover:text-white'}`}>
            <User size={16}/> Profile
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {analysisResult && (
          <div className="hidden md:flex items-center gap-2">
            <button onClick={handleExportPDF} className="flex items-center gap-2 bg-indigo-50 dark:bg-[#111] text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-[#333] px-3 py-1.5 rounded-md text-xs font-bold hover:bg-indigo-100 dark:hover:bg-[#222] transition-colors shadow-sm dark:shadow-none">
              <Download size={14}/> PDF Report
            </button>
            <button onClick={handleExportExcel} className="flex items-center gap-2 bg-emerald-50 dark:bg-[#111] text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-[#333] px-3 py-1.5 rounded-md text-xs font-bold hover:bg-emerald-100 dark:hover:bg-[#222] transition-colors shadow-sm dark:shadow-none">
              <Download size={14}/> Export CSV
            </button>
          </div>
        )}
        <button onClick={() => setStealthMode(!stealthMode)} className="text-slate-400 dark:text-neutral-400 hover:text-indigo-500 dark:hover:text-white transition-colors" title="Stealth Mode">
          {stealthMode ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
        <button onClick={toggleTheme} className="text-slate-400 dark:text-neutral-400 hover:text-orange-500 dark:hover:text-white transition-colors" title="Toggle Theme">
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
    </nav>
  );

  const renderHomeView = () => {
    if (!analysisResult) {
      return (
        <div className="h-[70vh] flex flex-col items-center justify-center bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-[#222] rounded-2xl relative overflow-hidden transition-colors duration-300 shadow-sm dark:shadow-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/10 dark:bg-orange-500/5 rounded-full blur-3xl pointer-events-none"></div>
          {loading ? (
            <div className="flex flex-col items-center text-center z-10">
              <Loader2 size={40} className="text-orange-500 animate-spin mb-4" />
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">Engaging God Mode AI...</h2>
              <p className="text-slate-500 dark:text-neutral-500 mt-2 text-sm">Calculating runway, flagging impulse buys, and analyzing surges.</p>
            </div>
          ) : (
            <div className="flex flex-col items-center text-center max-w-md z-10">
              <div className="w-16 h-16 bg-slate-50 dark:bg-[#111] border border-slate-100 dark:border-[#333] rounded-2xl flex items-center justify-center mb-6 shadow-sm dark:shadow-none">
                <UploadCloud size={32} className="text-orange-500" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Upload Bank Statement</h2>
              <p className="text-slate-500 dark:text-neutral-400 mb-8 text-sm leading-relaxed">
                Upload your CSV file to unlock the multi-page AI Copilot dashboard.
              </p>
              <label className="cursor-pointer bg-orange-500 hover:bg-orange-600 text-white dark:text-black px-8 py-3 rounded-lg font-bold transition-colors flex items-center justify-center gap-2 shadow-sm">
                Select CSV File
                <input type="file" className="hidden" accept=".csv" onChange={handleFileUpload} />
              </label>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className={`${isDanger ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900/50' : 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/50'} border rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors duration-500 shadow-sm dark:shadow-none`}>
          <div className="flex items-center gap-4">
            <div className={`w-10 h-10 rounded-full ${isDanger ? 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-500' : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-500'} flex items-center justify-center shrink-0 transition-colors duration-300`}>
              {isDanger ? <AlertTriangle size={20} /> : <CheckCircle2 size={20} />}
            </div>
            <div>
              <h2 className={`font-bold text-lg ${isDanger ? 'text-red-700 dark:text-red-400' : 'text-emerald-700 dark:text-emerald-400'} transition-colors duration-300`}>
                {isDanger ? "Warning: High Burn Rate Detected" : "Financial Health: Stable"}
              </h2>
              <p className="text-slate-500 dark:text-neutral-400 text-sm mt-0.5 transition-colors duration-300">
                Analyzed {analysisResult.categorized.length} transactions • Runway: <strong className="text-slate-800 dark:text-white">{analysisResult.predictions?.broke_date || 'Unknown'}</strong>
              </p>
            </div>
          </div>
          <button 
             onClick={() => {
                setAnalysisResult(null);
                setFile(null);
                setChatHistory([{ role: 'ai', content: "Hello! I am your AI financial copilot. Ask me anything about your spending." }]);
             }}
             className="px-4 py-2 bg-white dark:bg-black border border-slate-200 dark:border-[#333] hover:bg-slate-50 dark:hover:bg-[#111] text-slate-700 dark:text-white font-bold rounded-lg text-sm transition-colors flex items-center gap-2 shadow-sm whitespace-nowrap"
          >
             <UploadCloud size={16} /> New Scan
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-[#222] rounded-xl p-6 transition-colors duration-300 shadow-sm dark:shadow-none">
             <h3 className="text-xs font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-widest mb-6">Spending Breakdown</h3>
             <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={getSpendingData()} innerRadius={70} outerRadius={90} paddingAngle={2} dataKey="value" stroke="none">
                      {getSpendingData().map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                    </Pie>
                    <RechartsTooltip contentStyle={{ backgroundColor: theme==='dark'?'#111':'#fff', borderColor: theme==='dark'?'#333':'#e2e8f0', color: theme==='dark'?'#fff':'#000', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} formatter={(val: any) => formatAmount(-val)}/>
                  </PieChart>
                </ResponsiveContainer>
             </div>
          </div>
          <div className="bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-[#222] rounded-xl p-6 transition-colors duration-300 shadow-sm dark:shadow-none">
             <h3 className="text-xs font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-widest mb-6">Monthly Cash Flow</h3>
             <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={getBarData()} margin={{ left: -20, bottom: 0, top: 10 }}>
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#737373', fontSize: 11}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#737373', fontSize: 11}} tickFormatter={(v) => `${currencySymbol}${v/1000}k`} />
                    <RechartsTooltip cursor={{fill: theme==='dark'?'#111':'#f1f5f9'}} contentStyle={{ backgroundColor: theme==='dark'?'#111':'#fff', borderColor: theme==='dark'?'#333':'#e2e8f0', color: theme==='dark'?'#fff':'#000', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} formatter={(val: any) => formatAmount(-val)} />
                    <Bar dataKey="value" fill="#f97316" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  </BarChart>
                </ResponsiveContainer>
             </div>
          </div>
          <div className="bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-[#222] rounded-xl p-6 transition-colors duration-300 shadow-sm dark:shadow-none">
             <h3 className="text-xs font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-widest mb-6">Yearly Cash Flow</h3>
             <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={getYearlyBarData()} margin={{ left: -20, bottom: 0, top: 10 }}>
                    <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{fill: '#737373', fontSize: 11}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#737373', fontSize: 11}} tickFormatter={(v) => `${currencySymbol}${v/1000}k`} />
                    <RechartsTooltip cursor={{fill: theme==='dark'?'#111':'#f1f5f9'}} contentStyle={{ backgroundColor: theme==='dark'?'#111':'#fff', borderColor: theme==='dark'?'#333':'#e2e8f0', color: theme==='dark'?'#fff':'#000', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} formatter={(val: any) => formatAmount(-val)} />
                    <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={60} />
                  </BarChart>
                </ResponsiveContainer>
             </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-[#222] rounded-xl p-6 relative overflow-hidden transition-colors duration-300 shadow-sm dark:shadow-none mt-6">
          <div className="flex items-center gap-2 mb-4 relative z-10">
            <h3 className="text-xl font-serif font-bold text-slate-800 dark:text-white">Statement Intelligence</h3>
          </div>
          <div className="text-slate-700 dark:text-neutral-300 relative z-10 leading-relaxed transition-colors duration-300">
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown>
                {analysisResult.summary}
              </ReactMarkdown>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderTransactionsView = () => {
    if (!analysisResult) return <div className="text-center text-slate-500 py-20">Please upload a file in the Home tab first.</div>;
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-[#222] p-4 rounded-xl shadow-sm dark:shadow-none transition-colors duration-300">
          <div className="relative w-full sm:w-96">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-neutral-500" />
            <input 
              type="text" 
              placeholder="Search by description or category..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-[#111] border border-slate-200 dark:border-[#333] rounded-lg text-sm text-slate-800 dark:text-white focus:outline-none focus:border-orange-500 transition-colors"
            />
          </div>
          <div className="text-sm font-bold text-slate-500 dark:text-neutral-500">
            Showing {sortedFilteredTransactions.length} of {analysisResult.categorized.length}
          </div>
        </div>

        <div className="bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-[#222] rounded-xl overflow-hidden transition-colors duration-300 shadow-sm dark:shadow-none min-h-[600px]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 dark:text-neutral-400">
              <thead className="text-[11px] uppercase bg-slate-50 dark:bg-[#111] text-slate-500 dark:text-neutral-500 font-bold tracking-wider transition-colors duration-300">
                <tr>
                  <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-[#222] transition-colors group" onClick={() => handleSort('date')}>
                    <div className="flex items-center gap-1">Date <ArrowUpDown size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" /></div>
                  </th>
                  <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-[#222] transition-colors group" onClick={() => handleSort('description')}>
                    <div className="flex items-center gap-1">Description <ArrowUpDown size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" /></div>
                  </th>
                  <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-[#222] transition-colors group" onClick={() => handleSort('amount')}>
                    <div className="flex items-center gap-1">Amount <ArrowUpDown size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" /></div>
                  </th>
                  <th className="px-6 py-4">AI Insights</th>
                  <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-[#222] transition-colors group" onClick={() => handleSort('category')}>
                    <div className="flex items-center gap-1">Category <ArrowUpDown size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" /></div>
                  </th>
                  <th className="px-4 py-4 w-12"></th>
                </tr>
              </thead>
              <tbody>
                {sortedFilteredTransactions.map((tx: any, idx: number) => {
                  const amount = typeof tx.amount === 'number' ? tx.amount : parseFloat(tx.amount || 0);
                  const isExpense = amount < 0;
                  return (
                    <tr key={idx} className="border-b border-slate-100 dark:border-[#1a1a1a] hover:bg-slate-50 dark:hover:bg-[#111] transition-colors group">
                      <td className="px-6 py-4 whitespace-nowrap font-mono text-[13px]">{tx.date}</td>
                      <td className="px-6 py-4 font-semibold text-slate-700 dark:text-neutral-200 transition-colors duration-300">
                        <span className="truncate block max-w-[250px]">{tx.description || tx.desc}</span>
                      </td>
                      <td className={`px-6 py-4 font-bold font-mono tracking-wide ${isExpense ? 'text-red-500 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                        {formatAmount(amount)}
                      </td>
                      <td className="px-6 py-4 flex gap-2 flex-wrap">
                        {tx.is_impulse && <span className="bg-orange-100 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/30 text-orange-700 dark:text-orange-400 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide">Impulse</span>}
                        {tx.is_surge && <span className="bg-red-100 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-400 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide">🚨 Surge</span>}
                        {!tx.is_impulse && !tx.is_surge && <span className="text-slate-300 dark:text-[#333] text-xs">—</span>}
                      </td>
                      <td className="px-6 py-4">
                        <span className="bg-slate-100 dark:bg-[#1a1a1a] text-slate-600 dark:text-neutral-300 px-3 py-1 rounded-full text-[11px] font-bold border border-slate-200 dark:border-[#333] transition-colors duration-300">
                          {tx.category || 'Other'}
                        </span>
                      </td>
                      <td className="px-4 py-4 relative text-right">
                         <div className="inline-block relative">
                           <button className="text-slate-400 dark:text-[#444] hover:text-slate-600 dark:hover:text-white transition-colors p-1 rounded-md hover:bg-slate-200 dark:hover:bg-[#222]">
                             <MoreVertical size={16} />
                           </button>
                           <div className="hidden group-hover:block absolute right-6 top-0 bg-white dark:bg-[#111] shadow-2xl border border-slate-200 dark:border-[#333] rounded-lg py-1 z-20 w-48 text-left transition-colors duration-300">
                             <button onClick={() => handleDocument("dispute", tx.description, amount)} className="block w-full text-left px-4 py-2 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-[#222] text-slate-700 dark:text-neutral-300 transition-colors">Write Dispute Email</button>
                             <button onClick={() => setActiveModal({title: "Razorpay Split Bill", message: `Generating a Razorpay Payment Link for ${formatAmount(amount)} to split this charge with your friends.`})} className="block w-full text-left px-4 py-2 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-[#222] text-slate-700 dark:text-neutral-300 transition-colors">Split Bill (Razorpay)</button>
                             <button onClick={() => handleDocument("negotiate", tx.description, amount)} className="block w-full text-left px-4 py-2 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-[#222] text-slate-700 dark:text-neutral-300 transition-colors">Generate Negotiation Script</button>
                           </div>
                         </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderChatView = () => {
    if (!analysisResult) return <div className="text-center text-slate-500 py-20">Please upload a file in the Home tab first.</div>;
    return (
      <div className="h-[calc(100vh-140px)] flex flex-col bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-[#222] rounded-2xl shadow-sm dark:shadow-none overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="p-4 border-b border-slate-200 dark:border-[#222] flex justify-between items-center bg-slate-50 dark:bg-[#111]">
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-slate-800 dark:text-white">AI Financial Copilot</h2>
          </div>
          <button onClick={handleRoast} className="flex items-center gap-2 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 px-3 py-1.5 rounded-md text-xs font-bold hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-colors">
            <Flame size={14}/> Roast My Spending
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {chatHistory.length === 0 && (
            <div className="text-center text-slate-400 dark:text-neutral-500 mt-20">
              <p>Ask me anything about your spending.</p>
              <p className="text-xs mt-2">Example: "How much did I spend on food this month?"</p>
            </div>
          )}
          {chatHistory.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] p-4 rounded-2xl ${msg.role === 'user' ? 'bg-orange-500 text-white rounded-br-none' : 'bg-slate-100 dark:bg-[#1a1a1a] text-slate-700 dark:text-neutral-200 rounded-bl-none'}`}>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              </div>
            </div>
          ))}
          {chatLoading && (
            <div className="flex justify-start">
              <div className="bg-slate-100 dark:bg-[#1a1a1a] p-4 rounded-2xl rounded-bl-none flex gap-2">
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></span>
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></span>
              </div>
            </div>
          )}
        </div>
        
        <form onSubmit={handleChatSubmit} className="p-4 border-t border-slate-200 dark:border-[#222] bg-white dark:bg-[#0a0a0a]">
          <div className="relative flex items-center">
            <input 
              type="text" 
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              placeholder="Ask about your spending..." 
              className="w-full bg-slate-50 dark:bg-[#111] border border-slate-200 dark:border-[#333] rounded-full pl-5 pr-12 py-3 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-orange-500 transition-colors"
            />
            <button type="submit" disabled={chatLoading} className="absolute right-2 p-2 bg-orange-500 hover:bg-orange-600 text-white rounded-full disabled:opacity-50 transition-colors">
              <Send size={16} />
            </button>
          </div>
        </form>
      </div>
    );
  };

  const renderReceiptView = () => (
    <div className="h-[70vh] flex flex-col items-center justify-center bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-[#222] rounded-2xl relative overflow-hidden transition-colors duration-300 shadow-sm dark:shadow-none animate-in fade-in slide-in-from-bottom-4">
      {receiptImage ? (
        <div className="flex flex-col items-center text-center w-full max-w-md p-6">
          <div className="w-full h-64 border-2 border-dashed border-slate-300 dark:border-[#333] rounded-xl overflow-hidden mb-6 relative">
            <img src={receiptImage} alt="Uploaded Receipt" className="w-full h-full object-cover" />
            {isScanning && (
              <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center">
                <div className="w-full h-1 bg-indigo-500 animate-[scan_2s_ease-in-out_infinite]"></div>
                <p className="text-white font-bold mt-4 animate-pulse">Running Vision AI...</p>
              </div>
            )}
          </div>
          
          {scanResult && (
            <div className="w-full bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 rounded-xl p-4 text-left">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold mb-2">
                <Check size={18} /> Receipt Parsed Successfully
              </div>
              <p className="text-slate-600 dark:text-neutral-300 text-sm mb-1"><strong>Merchant:</strong> {scanResult.merchant}</p>
              <p className="text-slate-600 dark:text-neutral-300 text-sm mb-1"><strong>Amount:</strong> {currencySymbol}{scanResult.amount}</p>
              <p className="text-slate-600 dark:text-neutral-300 text-sm mb-3"><strong>Date:</strong> {scanResult.date}</p>
              <button onClick={handleAddToLedger} className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg transition-colors">
                Add to Ledger
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center text-center max-w-md z-10">
          <div className="w-16 h-16 bg-indigo-50 dark:bg-[#111] border border-indigo-100 dark:border-[#333] rounded-2xl flex items-center justify-center mb-6">
            <Camera size={32} className="text-indigo-500" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Physical Receipt Scanner</h2>
          <p className="text-slate-500 dark:text-neutral-400 mb-8 text-sm leading-relaxed">
            Upload a photo of a physical receipt. The Vision AI will extract the line items and attempt to match them to a bank transaction.
          </p>
          <label className="cursor-pointer bg-indigo-500 hover:bg-indigo-600 text-white px-8 py-3 rounded-lg font-bold transition-colors shadow-sm">
            Select Image
            <input type="file" className="hidden" accept="image/*" onChange={handleReceiptUpload} />
          </label>
        </div>
      )}
    </div>
  );

  const renderProfileView = () => (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-[#222] rounded-xl p-8 shadow-sm dark:shadow-none text-center">
        <label className="cursor-pointer w-24 h-24 bg-orange-100 dark:bg-orange-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-orange-200 dark:border-orange-500/30 overflow-hidden relative group">
          {profileImage ? (
            <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <User size={40} className="text-orange-500" />
          )}
          <div className="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center">
            <span className="text-white text-xs font-bold">Edit</span>
          </div>
          <input type="file" className="hidden" accept="image/*" onChange={handleProfileImageUpload} />
        </label>
        
        {isEditingName ? (
           <input 
              type="text" 
              value={userName} 
              onChange={e => setUserName(e.target.value)}
              onBlur={() => { setIsEditingName(false); localStorage.setItem('moneyda_username', userName); }}
              onKeyDown={(e) => { if (e.key === 'Enter') { setIsEditingName(false); localStorage.setItem('moneyda_username', userName); } }}
              autoFocus
              className="text-2xl font-bold text-center bg-transparent border-b-2 border-orange-500 focus:outline-none dark:text-white"
           />
        ) : (
           <h2 onClick={() => setIsEditingName(true)} className="text-2xl font-bold text-slate-800 dark:text-white cursor-pointer hover:text-orange-500 transition-colors" title="Click to edit">
             {userName}
           </h2>
        )}
        
        <div className="mt-4 flex items-center justify-center gap-4">
           <label className="text-sm font-semibold text-slate-500 dark:text-neutral-400">Preferred Currency:</label>
           <select 
              value={preferredCurrency} 
              onChange={(e) => {
                 setPreferredCurrency(e.target.value);
                 localStorage.setItem('moneyda_currency', e.target.value);
              }}
              className="bg-white dark:bg-black border border-slate-200 dark:border-gray-700 text-slate-800 dark:text-white rounded-md px-3 py-1"
           >
              <option value="INR">INR (₹)</option>
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
           </select>
        </div>
      </div>

      <div className="bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-[#222] rounded-xl p-6 shadow-sm dark:shadow-none">
        <h3 className="font-bold text-slate-800 dark:text-white mb-6 uppercase tracking-widest text-xs text-slate-400">Financial Summary</h3>
        <div className="space-y-4">
          <div className="flex justify-between items-center py-3 border-b border-slate-100 dark:border-[#1a1a1a]">
            <span className="text-slate-600 dark:text-neutral-300">Total Spend Found</span>
            <span className="font-bold text-red-500">{currencySymbol}{stats.totalSpend.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-slate-100 dark:border-[#1a1a1a]">
            <span className="text-slate-600 dark:text-neutral-300">Top Spend Category</span>
            <span className="font-bold text-orange-500">{stats.topCategory}</span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-slate-100 dark:border-[#1a1a1a]">
            <span className="text-slate-600 dark:text-neutral-300">Avg Transaction Size</span>
            <span className="font-bold text-slate-800 dark:text-white">{currencySymbol}{stats.avgTx.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-[#222] rounded-xl p-6 shadow-sm dark:shadow-none">
        <h3 className="font-bold text-slate-800 dark:text-white mb-6 uppercase tracking-widest text-xs text-slate-400">Data Storage & Cache</h3>
        <div className="space-y-4">
          <div className="flex justify-between items-center py-3 border-b border-slate-100 dark:border-[#1a1a1a]">
            <span className="text-slate-600 dark:text-neutral-300">Total Transactions Cached</span>
            <span className="font-mono font-bold text-slate-800 dark:text-white">{analysisResult ? analysisResult.categorized.length : 0}</span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-slate-100 dark:border-[#1a1a1a]">
            <span className="text-slate-600 dark:text-neutral-300">Runway Prediction</span>
            <span className="font-bold text-slate-800 dark:text-white">{analysisResult?.predictions?.broke_date || 'N/A'}</span>
          </div>
          <div className="pt-4">
            <button onClick={clearCache} className="w-full py-3 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 font-bold rounded-lg border border-red-200 dark:border-red-500/30 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors">
              Wipe Device Cache
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderHistoryView = () => (
    <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">Statement History</h2>
      {history.length === 0 ? (
        <div className="text-center text-slate-500 py-20 bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-[#222] rounded-xl shadow-sm dark:shadow-none">
          No statements processed yet. Upload a CSV file to get started.
        </div>
      ) : (
        <div className="bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-[#222] rounded-xl overflow-hidden shadow-sm dark:shadow-none">
          <table className="w-full text-left text-sm text-slate-600 dark:text-neutral-400">
            <thead className="bg-slate-50 dark:bg-[#111] text-slate-500 dark:text-neutral-500 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-6 py-4">Date Processed</th>
                <th className="px-6 py-4">File Name</th>
                <th className="px-6 py-4">Transactions</th>
                <th className="px-6 py-4">Runway Prediction</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h, i) => (
                <tr key={i} className="border-b border-slate-100 dark:border-[#1a1a1a] hover:bg-slate-50 dark:hover:bg-[#111] transition-colors">
                  <td className="px-6 py-4 font-mono">{new Date(h.date).toLocaleDateString()}</td>
                  <td className="px-6 py-4 font-semibold text-slate-800 dark:text-white">
                    <button onClick={() => handleLoadHistory(h)} className="hover:underline hover:text-orange-500 transition-colors text-left font-bold">
                      {h.filename}
                    </button>
                  </td>
                  <td className="px-6 py-4">{h.transactions} txns</td>
                  <td className="px-6 py-4">
                    <span className="bg-orange-100 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400 px-2 py-1 rounded text-xs font-bold">
                      {h.runway}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const renderFraudView = () => {
    if (!analysisResult) return <div className="text-center py-20">Please upload a statement first.</div>;
    const txs = analysisResult.categorized || [];
    
    const anomalies: any[] = [];
    const seen = new Set();
    txs.forEach((tx: any) => {
        const amt = typeof tx.amount === 'number' ? tx.amount : parseFloat(tx.amount || 0);
        if (amt < 0) {
            const key = `${tx.date}_${amt}`;
            if (seen.has(key)) {
                anomalies.push({ ...tx, type: 'Duplicate Charge', risk: 'High' });
            } else {
                seen.add(key);
            }
        }
    });

    txs.forEach((tx: any) => {
        const amt = typeof tx.amount === 'number' ? tx.amount : parseFloat(tx.amount || 0);
        if (amt < -1000 && tx.category?.toLowerCase() === 'subscriptions') {
            anomalies.push({ ...tx, type: 'Expensive Subscription', risk: 'Medium' });
        }
    });

    const handleDispute = (tx: any) => {
        const email = `Subject: Dispute of Unauthorized/Duplicate Charge\n\nTo Customer Support,\n\nI am writing to formally dispute a recent charge made on my account on ${tx.date} for the amount of ${currencySymbol}${Math.abs(tx.amount).toFixed(2)} under the merchant name "${tx.description}".\n\nPlease investigate this transaction immediately and process a refund to my original payment method.\n\nSincerely,\n${userName}`;
        setActiveModal({title: "Draft Dispute Email", message: email});
    };

    return (
      <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2"><ShieldAlert className="text-red-500" /> Fraud & Anomaly Detective</h2>
        {anomalies.length === 0 ? (
          <div className="text-center text-slate-500 py-20 bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-[#222] rounded-xl shadow-sm dark:shadow-none">No anomalies detected. Your account is secure.</div>
        ) : (
          <div className="grid gap-4">
             {anomalies.map((a, i) => (
                <div key={i} className="bg-white dark:bg-[#0a0a0a] p-4 rounded-xl border border-red-200 dark:border-red-900/30 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm dark:shadow-none">
                   <div>
                     <span className={`px-2 py-1 text-[10px] uppercase font-bold rounded ${a.risk === 'High' ? 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400'} mb-2 inline-block`}>{a.type}</span>
                     <h4 className="font-bold text-slate-800 dark:text-white">{a.description}</h4>
                     <p className="text-sm text-slate-500 dark:text-neutral-400">{a.date} • {currencySymbol}{Math.abs(a.amount).toFixed(2)}</p>
                   </div>
                   <button onClick={() => handleDispute(a)} className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 text-white dark:text-black font-bold rounded-lg text-sm transition-colors whitespace-nowrap">
                     Draft Dispute
                   </button>
                </div>
             ))}
          </div>
        )}
      </div>
    );
  };

  const renderSimulatorView = () => {
     if (!analysisResult) return <div className="text-center py-20">Please upload a statement first.</div>;
     
     let totalIncome = 0;
     let totalExpense = 0;
     const uniqueMonths = new Set();
     (analysisResult.categorized || []).forEach((tx: any) => {
         const amt = typeof tx.amount === 'number' ? tx.amount : parseFloat(tx.amount || 0);
         if (amt > 0) totalIncome += amt;
         else totalExpense += Math.abs(amt);
         if (tx.date) uniqueMonths.add(tx.date.substring(0, 7));
     });
     
     const monthCount = Math.max(1, uniqueMonths.size);
     const monthlySavings = (totalIncome - totalExpense) / monthCount;
     const rzpInvestAmount = Math.min(Math.floor(monthlySavings), 490000); // Max safe Razorpay link amount
     
     const r = 0.12;
     const n = 12;
     const t = simYears;
     const pmt = monthlySavings > 0 ? monthlySavings : 0;
     
     const futureWealth = pmt * ((Math.pow(1 + r/n, n*t) - 1) / (r/n));
     const uninvestedWealth = pmt * 12 * t;

     const handleInvestSetup = async () => {
         setIsGeneratingInvestLink(true);
         setInvestLinkResult(null);
         try {
            const rzpRes = await fetch("/api/razorpay_link", {
               method: "POST",
               headers: { "Content-Type": "application/json" },
               body: JSON.stringify({ amount: rzpInvestAmount.toString(), description: "MoneyDa Auto-Invest Setup" })
            });
            const rzpData = await rzpRes.json();
            if (rzpData.short_url) {
                setInvestLinkResult(rzpData.short_url);
            } else {
                setInvestLinkResult("Error: " + rzpData.error);
            }
         } catch (e) {
             setInvestLinkResult("Network Error");
         } finally {
             setIsGeneratingInvestLink(false);
         }
     };

     return (
       <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
         <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2"><TrendingUp className="text-emerald-500" /> Time-Travel Wealth Simulator</h2>
         
         <div className="bg-white dark:bg-[#0a0a0a] p-6 rounded-xl border border-slate-200 dark:border-[#222] mb-6 shadow-sm dark:shadow-none">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Travel into the Future</h3>
            <input 
               type="range" min="1" max="30" value={simYears} 
               onChange={e => setSimYears(parseInt(e.target.value))} 
               className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-[#333] accent-orange-500"
            />
            <div className="flex justify-between text-sm text-slate-500 dark:text-neutral-400 mt-2 font-bold">
               <span>1 Year</span>
               <span className="text-orange-500 text-lg">{simYears} Years</span>
               <span>30 Years</span>
            </div>
         </div>

         {monthlySavings <= 0 ? (
            <div className="bg-red-50 dark:bg-red-500/10 p-6 rounded-xl border border-red-200 dark:border-red-900/30 text-center">
               <h3 className="text-xl font-bold text-red-600 dark:text-red-400 mb-2">Negative Cash Flow Alert</h3>
               <p className="text-slate-600 dark:text-red-200/70">Your expenses exceed your income by {currencySymbol}{Math.abs(monthlySavings).toFixed(2)}/month. You are burning cash and cannot build wealth until this is reversed.</p>
            </div>
         ) : (
            <>
            <div className="grid md:grid-cols-2 gap-6 mb-6">
               <div className="bg-white dark:bg-[#0a0a0a] p-6 rounded-xl border border-slate-200 dark:border-[#222] shadow-sm dark:shadow-none">
                  <h3 className="text-sm font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-widest mb-2">Status Quo (No Investing)</h3>
                  <p className="text-3xl font-black text-slate-800 dark:text-white">{currencySymbol}{uninvestedWealth.toLocaleString(undefined, {maximumFractionDigits: 0})}</p>
                  <p className="text-sm text-slate-500 mt-2">Just saving {currencySymbol}{monthlySavings.toLocaleString(undefined, {maximumFractionDigits:0})} every month in a bank account.</p>
               </div>
               <div className="bg-emerald-50 dark:bg-emerald-500/10 p-6 rounded-xl border border-emerald-200 dark:border-emerald-900/30 shadow-sm dark:shadow-none flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-2">Optimized Path (Invested @ 12%)</h3>
                    <p className="text-4xl font-black text-emerald-600 dark:text-emerald-400">{currencySymbol}{futureWealth.toLocaleString(undefined, {maximumFractionDigits: 0})}</p>
                    <p className="text-sm text-emerald-700 dark:text-emerald-200 mt-2">By investing {currencySymbol}{monthlySavings.toLocaleString(undefined, {maximumFractionDigits:0})} monthly in an Index Fund.</p>
                  </div>
                  <button 
                    onClick={handleInvestSetup}
                    disabled={isGeneratingInvestLink}
                    className="mt-6 w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                     {isGeneratingInvestLink ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
                     Setup Razorpay eMandate
                  </button>
               </div>
            </div>
            {investLinkResult && (
               <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-900/30 p-4 rounded-xl text-center">
                   <p className="font-bold text-emerald-800 dark:text-emerald-400">Your Razorpay Auto-Invest setup link is ready:</p>
                   {investLinkResult.startsWith("http") ? (
                      <a href={investLinkResult} target="_blank" className="text-emerald-600 dark:text-emerald-300 underline font-semibold break-all text-sm mt-2 inline-block">{investLinkResult}</a>
                   ) : (
                      <p className="text-red-500">{investLinkResult}</p>
                   )}
               </div>
            )}
            </>
         )}
       </div>
     );
  };

  return (
    <div className={`${theme} transition-colors duration-300`}>
      <div className="min-h-screen bg-[#f8fafc] dark:bg-black text-slate-800 dark:text-white font-sans selection:bg-orange-500/30 transition-colors duration-300">
        
        {/* Modal Overlay */}
        {activeModal && (
          <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm transition-all duration-300">
            <div className="bg-white dark:bg-[#111] rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 dark:border-[#333] transform transition-all duration-300 scale-100">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">{activeModal.title}</h3>
                <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-600 dark:text-neutral-500 dark:hover:text-white transition-colors"><X size={20}/></button>
              </div>
              <div className="text-slate-600 dark:text-neutral-300 text-sm mb-6 leading-relaxed whitespace-pre-wrap font-mono bg-slate-50 dark:bg-black p-4 rounded-lg border border-slate-100 dark:border-[#222]">
                {activeModal.message}
              </div>
              <button onClick={() => setActiveModal(null)} className="w-full bg-orange-500 text-white dark:text-black font-bold py-2.5 rounded-lg hover:bg-orange-600 transition-colors">
                Close
              </button>
            </div>
          </div>
        )}

        {renderNav()}

        <main className="max-w-7xl mx-auto p-4 md:p-8">
          {currentView === 'home' && renderHomeView()}
          {currentView === 'transactions' && renderTransactionsView()}
          {currentView === 'chat' && renderChatView()}
          {currentView === 'receipt' && renderReceiptView()}
          {currentView === 'fraud' && renderFraudView()}
          {currentView === 'simulator' && renderSimulatorView()}
          {currentView === 'history' && renderHistoryView()}
          {currentView === 'profile' && renderProfileView()}
        </main>
      </div>
    </div>
  );
}
