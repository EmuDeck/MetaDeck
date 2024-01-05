// Add button second to last
import {
    afterPatch,
    fakeRenderComponent, findInReactTree,
    findModuleChild,
    MenuItem, Navigation,
} from "decky-frontend-lib";
import {VFC} from "react";
import {useTranslations} from "./useTranslations";


const MetaDeckChangeMetadata: VFC<{ appId: number }> = ({appId}) =>
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
const spliceArtworkItem = (children: any[], appId: number) =>
{
    children.find((x: any) => x?.key === 'properties');
    const propertiesMenuItemIdx = children.findIndex((item) =>
        findInReactTree(item, (x) => x?.onSelected && x.onSelected.toString().includes('AppProperties'))
    );
    children.splice(propertiesMenuItemIdx, 0, (
			<MetaDeckChangeMetadata key="metadeck-change-metadata"
			                        appId={appId}
            />
	));
};

const renderedMap = {};

/**
 * Patches the game context menu.
 * @param LibraryContextMenu The game context menu.
 * @returns A patch to remove when the plugin dismounts.
 */
const contextMenuPatch = (LibraryContextMenu: any) => {
	return afterPatch(LibraryContextMenu.prototype, 'render', (_: Record<string, unknown>[], component: any) => {
		const appid: number = component._owner.pendingProps.overview.appid;

		if (!Object.keys(renderedMap).includes(appid.toString()) && !window.location.pathname.endsWith('/routes/library/home')) {
			renderedMap[appid.toString()] = true;

			afterPatch(component.type.prototype, 'shouldComponentUpdate', ([nextProps]: any, shouldUpdate: any) => {
				const metadeckIdx = nextProps.children.findIndex((x: any) => x?.key === 'metadeck-change-metadata');
				if (metadeckIdx != -1) nextProps.children.splice(metadeckIdx, 1);

				if (shouldUpdate === true) {
					let updatedAppid: number = appid;
					// find the first menu component that has the correct appid assigned to _owner
					const parentOverview = nextProps.children.find((x: any) => x?._owner?.pendingProps?.overview?.appid &&
						   x._owner.pendingProps.overview.appid !== appid
					);
					// if found then use that appid
					if (parentOverview) {
						updatedAppid = parentOverview._owner.pendingProps.overview.appid;
					}
					spliceArtworkItem(nextProps.children, updatedAppid);
				}

				return shouldUpdate;
			}, { singleShot: true });
		} else {
			spliceArtworkItem(component.props.children, appid);
		}

		return component;
	});
};

/**
 * Game context menu component.
 */
export const LibraryContextMenu = fakeRenderComponent(
	   findModuleChild((m) => {
		   if (typeof m !== 'object') return;
		   for (const prop in m) {
			   if (
					 m[prop]?.toString() &&
					 m[prop].toString().includes('().LibraryContextMenu')
			   ) {
				   return Object.values(m).find((sibling) => (
						 // @ts-ignore
						 sibling?.toString().includes('createElement') &&
						 // @ts-ignore
						 sibling?.toString().includes('navigator:')
				   ));
			   }
		   }
		   return;
	   })
).type;

export default contextMenuPatch;