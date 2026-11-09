import {useState} from 'react'

/**
 * Brand asset slot. When the owner supplies the final SVG,
 * commit it at public/ui/blue-renaissance-logo.svg.
 * Text wordmark remains visible until that file exists.
 */
export default function BlueRenaissanceBrand(){
  const [assetAvailable,setAssetAvailable]=useState(true)
  return <div className="br-brand" aria-label="Blue Renaissance CMS">
    {assetAvailable?<img src="/ui/blue-renaissance-logo.svg"
      className="br-logo" alt="Blue Renaissance" onError={()=>setAssetAvailable(false)}/>:
      <span className="br-wordmark">Blue Renaissance</span>}
    <span className="br-edition">CMS</span>
  </div>
}
