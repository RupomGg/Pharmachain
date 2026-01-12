import { useMemo } from 'react'
import ReactFlow, { Background, Controls, MiniMap, Handle, Position } from 'reactflow'
import type { Node, Edge } from 'reactflow'
import { Package, AlertTriangle } from 'lucide-react'
import type { Batch } from '../../types/batch'
import { getStatusColor } from '../../lib/utils'
import 'reactflow/dist/style.css'

interface BatchNodeData {
  batch: Batch
}

function BatchNode({ data }: { data: BatchNodeData }) {
  const { batch } = data
  const statusColor = getStatusColor(batch.status)
  const isRecalled = batch.status === 'RECALLED'

  return (
    <div className="relative">
      <Handle type="target" position={Position.Top} />

      <div className={`
        px-4 py-3 rounded-lg border-2 min-w-[200px] bg-white dark:bg-gray-900
        ${isRecalled ? 'border-red-500 animate-pulse-glow' : `border-${statusColor.replace('bg-', '')}`}
        hover:shadow-lg transition-all cursor-pointer
      `}>
        <div className="flex items-center gap-2 mb-2">
          {isRecalled ? (
            <AlertTriangle className="w-5 h-5 text-red-500" />
          ) : (
            <Package className="w-5 h-5" />
          )}
          <span className="font-bold">Batch #{batch.batchId}</span>
        </div>

        <div className="text-sm space-y-1">
          <p className="text-gray-600 dark:text-gray-400">
            {batch.quantity} {batch.unit}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500 truncate">
            Owner: {batch.owner.slice(0, 10)}...
          </p>
          <span className={`
            inline-block px-2 py-1 rounded text-xs text-white
            ${statusColor}
          `}>
            {batch.status.replace('_', ' ')}
          </span>
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} />
    </div>
  )
}

const nodeTypes = {
  batchNode: BatchNode,
}

interface TraceabilityMapProps {
  rootBatch: Batch
  upstreamBatches: Batch[]
  downstreamBatches: Batch[]
}

export function TraceabilityMap({ rootBatch, upstreamBatches, downstreamBatches }: TraceabilityMapProps) {
  const { nodes, edges } = useMemo(() => {
    const nodes: Node<BatchNodeData>[] = []
    const edges: Edge[] = []

    // Root batch (center)
    nodes.push({
      id: `batch-${rootBatch.batchId}`,
      type: 'batchNode',
      position: { x: 400, y: 300 },
      data: { batch: rootBatch },
    })

    // Upstream (parents) - positioned above
    upstreamBatches.forEach((batch, idx) => {
      const x = 200 + idx * 250
      const y = 50

      nodes.push({
        id: `batch-${batch.batchId}`,
        type: 'batchNode',
        position: { x, y },
        data: { batch },
      })

      // Create edge from parent to root
      edges.push({
        id: `edge-${batch.batchId}-${rootBatch.batchId}`,
        source: `batch-${batch.batchId}`,
        target: `batch-${rootBatch.batchId}`,
        animated: true,
        style: { stroke: '#14b8a6', strokeWidth: 2 },
      })
    })

    // Downstream (children) - positioned below
    downstreamBatches.forEach((batch, idx) => {
      const x = 200 + idx * 250
      const y = 550

      nodes.push({
        id: `batch-${batch.batchId}`,
        type: 'batchNode',
        position: { x, y },
        data: { batch },
      })

      // Create edge from root to child
      edges.push({
        id: `edge-${rootBatch.batchId}-${batch.batchId}`,
        source: `batch-${rootBatch.batchId}`,
        target: `batch-${batch.batchId}`,
        animated: true,
        style: { stroke: '#14b8a6', strokeWidth: 2 },
      })
    })

    return { nodes, edges }
  }, [rootBatch, upstreamBatches, downstreamBatches])

  return (
    <div className="h-[600px] w-full border rounded-lg overflow-hidden">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-left"
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  )
}
