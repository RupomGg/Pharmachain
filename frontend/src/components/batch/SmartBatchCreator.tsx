import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileText, Check, Loader2 } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"


// Mock IPFS Upload (replace with real Pinata/IPFS client)
const uploadToIPFS = async (_fileOrJson: any): Promise<string> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(`Qm${Math.random().toString(36).substring(7)}HASH`)
    }, 2000)
  })
}

interface SmartBatchCreatorProps {
  onMetadataCreated: (ipfsHash: string) => void
}

export function SmartBatchCreator({ onMetadataCreated }: SmartBatchCreatorProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [pdfCID, setPdfCID] = useState<string | null>(null)
  const [metadata, setMetadata] = useState({ name: '', expiry: '', dosage: '' })
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles[0]) {
      setPdfFile(acceptedFiles[0])
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop, 
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1
  })

  // Step 1 -> 2: Upload PDF
  const handleUploadPDF = async () => {
    if (!pdfFile) return
    setIsUploading(true)
    setUploadProgress(10)
    
    // Simulate progress
    const interval = setInterval(() => {
      setUploadProgress(prev => Math.min(prev + 10, 90))
    }, 200)

    try {
      const cid = await uploadToIPFS(pdfFile)
      clearInterval(interval)
      setUploadProgress(100)
      setPdfCID(cid)
      setStep(2)
    } catch (err) {
      console.error(err)
    } finally {
      setIsUploading(false)
    }
  }

  // Step 2 -> 3: Create Metadata JSON & Bundle
  const handleCreateMetadata = async () => {
    setIsUploading(true)
    try {
      const metadataBundle = {
        productName: metadata.name,
        expiryDate: metadata.expiry,
        dosageInstructions: metadata.dosage,
        documents: [
          {
            type: "Usage Guide",
            ipfsHash: pdfCID
          }
        ],
        pdf: `ipfs://${pdfCID}` // Direct link for simpler parsing
      }

      console.log('Uploading Metadata Bundle:', metadataBundle)
      const metadataCID = await uploadToIPFS(metadataBundle)
      
      onMetadataCreated(metadataCID) // Pass back to parent form
      setStep(3) // Success state
    } catch (err) {
      console.error(err)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <Card className="w-full border-dashed border-2 border-slate-200 shadow-sm bg-slate-50/50">
      <CardContent className="pt-6">
        {step === 1 && (
          <div className="space-y-4">
            <div 
              {...getRootProps()} 
              className={`h-40 flex flex-col items-center justify-center rounded-xl border-2 border-dashed transition-colors cursor-pointer
                ${isDragActive ? 'border-teal-400 bg-teal-50' : 'border-slate-300 hover:border-teal-400 hover:bg-slate-100'}
              `}
            >
              <input {...getInputProps()} />
              {pdfFile ? (
                <div className="flex flex-col items-center text-teal-600">
                  <FileText className="w-10 h-10 mb-2" />
                  <p className="font-medium text-sm">{pdfFile.name}</p>
                </div>
              ) : (
                <div className="flex flex-col items-center text-slate-400">
                  <Upload className="w-10 h-10 mb-2" />
                  <p className="text-sm">Drag drop PDF guide here, or click to select</p>
                </div>
              )}
            </div>

            {pdfFile && (
              <Button onClick={handleUploadPDF} disabled={isUploading} className="w-full">
                {isUploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Upload Document (Step 1/2)
              </Button>
            )}
            
            {isUploading && <Progress value={uploadProgress} className="h-2" />}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
            <div className="flex items-center text-teal-600 text-sm font-medium mb-4">
              <Check className="w-4 h-4 mr-2" />
              Document Uploaded (CID: {pdfCID?.substring(0, 8)}...)
            </div>

            <div className="space-y-2">
              <Label>Medicine Name</Label>
              <Input 
                value={metadata.name} 
                onChange={(e) => setMetadata({...metadata, name: e.target.value})} 
                placeholder="Ex: Aspirin 500mg"
              />
            </div>

            <div className="space-y-2">
              <Label>Expiry Date</Label>
              <Input 
                type="date"
                value={metadata.expiry} 
                onChange={(e) => setMetadata({...metadata, expiry: e.target.value})} 
              />
            </div>

            <div className="space-y-2">
              <Label>Dosage / Instructions</Label>
              <Input 
                value={metadata.dosage} 
                onChange={(e) => setMetadata({...metadata, dosage: e.target.value})} 
                placeholder="Ex: Take 1 tablet daily after food"
              />
            </div>

            <Button onClick={handleCreateMetadata} disabled={isUploading || !metadata.name} className="w-full bg-slate-900">
              {isUploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Generate Metadata Hash (Step 2/2)
            </Button>
          </div>
        )}

        {step === 3 && (
          <div className="text-center py-4 text-teal-600 animate-in zoom-in-50">
             <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-3">
               <Check className="w-6 h-6" />
             </div>
             <p className="font-medium">Metadata Ready!</p>
             <p className="text-xs text-slate-500">Hash attached to batch form.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
