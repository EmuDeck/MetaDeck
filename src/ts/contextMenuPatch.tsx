// Add button second to last
import {FC} from "react";
import {useTranslations} from "./useTranslations";
import {
	afterPatch,
	fakeRenderComponent,
	findInReactTree,
	findModuleChild,
	MenuItem,
	Navigation,
	Patch
} from "@decky/ui";

const MetaDeckChangeMetadata: FC<{ appId: number }> = ({appId}) =>
{
	const t = useTranslations()
	return <MenuItem
		   onSelected={async () =>
		   {
			   Navigation.Navigate(`/metadeck/metadata/${appId}`)
		   }}
	>
		{t("changeMetadata")}...
	</MenuItem>
}

// Always add before "Properties..."
const spliceChangeMetadata = (children: any[], appid: number) => {
	children.find((x: any) => x?.key === 'properties')
	const propertiesMenuItemIdx = children.findIndex((item) =>
		   findInReactTree(
				 item,
				 (x) => x?.onSelected && x.onSelected.toString().includes('AppProperties')
		   )
	)
	children.splice(
		   propertiesMenuItemIdx,
		   0,
		   <MetaDeckChangeMetadata key="metadeck-change-metadata"
							  appId={appid}
		   />
	)
}

/**
 * Patches the game context menu.
 * @param LibraryContextMenu The game context menu.
 * @returns A patch to remove when the plugin dismounts.
 */
const contextMenuPatch = (LibraryContextMenu: any) => {
	const patches: {
		outer?: Patch
		inner?: Patch
		unpatch: () => void
	} = {
		unpatch: () => {
			return null
		}
	}
	patches.outer = afterPatch(
		   LibraryContextMenu.prototype,
		   'render',
		   (_: Record<string, unknown>[], component: any) => {
			   const appid: number = component._owner.pendingProps.overview.appid

			   if (!patches.inner) {
				   patches.inner = afterPatch(
						 component.type.prototype,
						 'shouldComponentUpdate',
						 ([nextProps]: any, shouldUpdate: any) => {
							 console.log(nextProps)
							 if (Array.isArray(nextProps.children))
							 {
								 const gtmIdx = nextProps.children.findIndex(
									    (x: any) => x?.key === 'metadeck-change-metadata'
								 )
								 if (gtmIdx != -1) nextProps.children.splice(gtmIdx, 1)

								 if (shouldUpdate === true)
								 {
									 let updatedAppid: number = appid
									 // find the first menu component that has the correct appid assigned to _owner
									 const parentOverview = nextProps.children.find(
										    (x: any) =>
												  x?._owner?.pendingProps?.overview?.appid &&
												  x._owner.pendingProps.overview.appid !== appid
									 )
									 // if found then use that appid
									 if (parentOverview)
									 {
										 updatedAppid = parentOverview._owner.pendingProps.overview.appid
									 }
									 spliceChangeMetadata(nextProps.children, updatedAppid)
								 }
							 }

							 return shouldUpdate
						 }
				   )
			   } else {
				   spliceChangeMetadata(component.props.children, appid)
			   }

			   return component
		   }
	)
	patches.unpatch = () => {
		patches.outer?.unpatch()
		patches.inner?.unpatch()
	}
	return patches
}

/**
 * Game context menu component.
 */
export const LibraryContextMenu = fakeRenderComponent(
	   findModuleChild((m) => {
		   if (typeof m !== 'object') return
		   for (const prop in m) {
			   if (
					 m[prop]?.toString() &&
					 m[prop].toString().includes('().LibraryContextMenu')
			   ) {
				   return Object.values(m).find(
						 (sibling) =>
							    sibling?.toString().includes('createElement') &&
							    sibling?.toString().includes('navigator:')
				   )
			   }
		   }
		   return
	   })
).type

export default contextMenuPatch