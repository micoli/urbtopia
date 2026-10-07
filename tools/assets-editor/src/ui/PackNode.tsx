import { Accordion } from 'radix-ui'
import { AssetRows, type RowsContext } from './components/AssetRows'
import type { TreePack } from '../treeModel'

interface Props extends RowsContext {
  node: TreePack
}

export function PackNode({ node, ...context }: Props) {
  return (
    <Accordion.Item value={node.pack} className="pack-node">
      <Accordion.Header asChild>
        <div className="pack-header">
          <Accordion.Trigger className="pack-trigger">
            <span className="chevron" aria-hidden>▸</span>
            {node.pack}
            <span className="count">{node.assets.length}</span>
          </Accordion.Trigger>
        </div>
      </Accordion.Header>
      <Accordion.Content className="pack-content" role="group">
        <AssetRows assets={node.assets} {...context} />
      </Accordion.Content>
    </Accordion.Item>
  )
}
