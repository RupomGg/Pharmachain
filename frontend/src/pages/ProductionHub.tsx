import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { BulkBatchImport } from '../components/BulkBatchImport'
import { ManualEntryForm } from '../components/forms/ManualEntryForm'
import { FileSpreadsheet, Plus, ArrowLeft, Info, Cpu, Activity, Database } from 'lucide-react'
import { Button } from '../components/ui/button'
import { useNavigate } from 'react-router-dom'

export function ProductionHub() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState("manual")
  const [manualBatchData, setManualBatchData] = useState<any[]>([])

  const handleManualAdd = (data: any) => {
    setManualBatchData(prev => [...prev, data])
    setActiveTab("bulk") // Auto switch to show the table
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white relative overflow-hidden">
        {/* Background Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-teal-500/10 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="container mx-auto p-4 md:p-6 max-w-7xl relative z-10">
           {/* HEADER */}
           <div className="mb-8 border-b border-white/10 pb-6">
              <div className="flex items-center gap-2 mb-4">
                 <Button 
                    variant="ghost" 
                    size="sm" 
                    className="-ml-3 text-slate-400 hover:text-white hover:bg-white/5 transition-colors border border-transparent hover:border-white/10" 
                    onClick={() => navigate('/manufacturer/dashboard')}
                 >
                   <ArrowLeft className="w-4 h-4 mr-2" /> Back
                 </Button>
              </div>
              <div className="flex items-center gap-3">
                  <div className="p-2 bg-teal-500/10 rounded-lg border border-teal-500/20">
                    <Cpu className="w-8 h-8 text-teal-400" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Production Hub</h1>
                    <p className="text-slate-400 mt-1 flex items-center gap-2">
                        Initialize new batch sequences via manual entry or bulk CSV uplink.
                    </p>
                  </div>
              </div>
           </div>
    
          {/* TABS Layout */}
          <Tabs defaultValue="manual" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <div className="flex items-center justify-between bg-slate-900/80 p-1.5 rounded-xl border border-white/10 shadow-lg backdrop-blur-md">
              <TabsList className="bg-transparent p-0 gap-2">
                 <TabsTrigger 
                    value="manual" 
                    className="px-6 py-2.5 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-600 data-[state=active]:to-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-teal-900/20 text-slate-400 hover:text-slate-200 transition-all border border-transparent data-[state=active]:border-teal-400/20"
                 >
                   <Plus className="w-4 h-4 mr-2" />
                   Manual Entry
                 </TabsTrigger>
                 <TabsTrigger 
                    value="bulk" 
                    className="px-6 py-2.5 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-600 data-[state=active]:to-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-teal-900/20 text-slate-400 hover:text-slate-200 transition-all border border-transparent data-[state=active]:border-teal-400/20"
                 >
                   <FileSpreadsheet className="w-4 h-4 mr-2" />
                   Bulk Import / Queue
                 </TabsTrigger>
              </TabsList>
              
             <div className="pr-4 text-xs font-mono text-teal-400/80 flex items-center gap-2">
                 <Database className="w-4 h-4" />
                 QUEUE_SIZE: <span className="text-white font-bold">{manualBatchData.length}</span>
                 {manualBatchData.length > 0 && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setManualBatchData([])}
                      className="ml-2 h-6 px-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 border border-red-500/20"
                    >
                      Clear
                    </Button>
                 )}
              </div>
            </div>
    
            <TabsContent value="manual" className="mt-0 focus-visible:outline-none">
               <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                  <div className="lg:col-span-3">
                     <ManualEntryForm onAddBatch={handleManualAdd} />
                  </div>
                  
                  {/* Holographic Quick Guide */}
                  <div className="lg:col-span-1">
                      <div className="bg-slate-900/80 border-l-2 border-teal-500 p-6 rounded-r-xl sticky top-6 shadow-[0_0_30px_rgba(20,184,166,0.1)] backdrop-blur-md">
                         <h3 className="font-bold text-lg text-white mb-6 flex items-center gap-2">
                            <Info className="w-5 h-5 text-teal-400" />
                            System Guide
                         </h3>
                         <ul className="space-y-6">
                            <li className="flex gap-3 group">
                                <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-teal-400 shadow-[0_0_8px_rgba(45,212,191,0.8)] group-hover:scale-150 transition-transform" /> 
                                <span className="text-slate-400 text-sm group-hover:text-slate-200 transition-colors">Enter all mandatory batch details carefully in the form.</span>
                            </li>
                            <li className="flex gap-3 group">
                                <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-teal-400 shadow-[0_0_8px_rgba(45,212,191,0.8)] group-hover:scale-150 transition-transform" /> 
                                <span className="text-slate-400 text-sm group-hover:text-slate-200 transition-colors">Click <span className="text-teal-400 font-medium">"Add to Queue"</span> to stage the batch locally.</span>
                            </li>
                            <li className="flex gap-3 group">
                                <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-teal-400 shadow-[0_0_8px_rgba(45,212,191,0.8)] group-hover:scale-150 transition-transform" /> 
                                <span className="text-slate-400 text-sm group-hover:text-slate-200 transition-colors">Staged batches appear in the <span className="text-teal-400 font-medium">"Bulk Import"</span> tab.</span>
                            </li>
                            <li className="flex gap-3 group">
                                <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-teal-400 shadow-[0_0_8px_rgba(45,212,191,0.8)] group-hover:scale-150 transition-transform" /> 
                                <span className="text-slate-400 text-sm group-hover:text-slate-200 transition-colors">Review all parameters before finalizing the minting process.</span>
                            </li>
                         </ul>

                         <div className="mt-8 pt-6 border-t border-white/10">
                            <div className="flex items-center gap-3 p-3 bg-teal-500/5 rounded-lg border border-teal-500/10">
                                <Activity className="w-5 h-5 text-teal-400" />
                                <div>
                                    <p className="text-xs text-slate-400 uppercase tracking-wider">System Status</p>
                                    <p className="text-sm font-bold text-teal-400">OPTIMAL</p>
                                </div>
                            </div>
                         </div>
                      </div>
                  </div>
               </div>
            </TabsContent>
    
           <TabsContent value="bulk" className="mt-0 focus-visible:outline-none">
               {/* Passing manualBatchData to BulkBatchImport so it can display them mixed with CSV data */}
               <BulkBatchImport 
                  initialData={manualBatchData} 
                  onSuccess={() => setManualBatchData([])} // Clear queue on success
               />
           </TabsContent>
          </Tabs>
        </div>
    </div>
  )
}
