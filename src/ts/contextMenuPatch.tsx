// Add button second to last
import {
	afterPatch,
	fakeRenderComponent,
	findInReactTree,
	findInTree,
	MenuItem,
	showModal
} from "decky-frontend-lib";
import {MetaDataModal} from "./MetaDataModal";
import {MetadataManager} from "./MetadataManager";
import {VFC} from "react";
import {useTranslations} from "./useTranslations";


const MetaDeckChangeMetadata: VFC<{ appId: number, metadataManager: MetadataManager }> = ({appId, metadataManager}) =>
{
	const t = useTranslations()
	return <MenuItem
			onSelected={async () =>
			{
				await showModal(
						<MetaDataModal appId={appId} manager={metadataManager} closeModal={() =>
						{
						}}/>
				)
			}}
	>
		{t("changeMetadata")}...
	</MenuItem>
}
const spliceArtworkItem = (children: any[], appId: number, metadataManager: MetadataManager) =>
{
	children.splice(-1, 0, (
			<MetaDeckChangeMetadata key="metadeck-change-metadata"
			                        appId={appId}
			                        metadataManager={metadataManager}/>
	));
};

const contextMenuPatch = (LibraryContextMenu: any, metadataManager: MetadataManager) =>
{
	return afterPatch(
			LibraryContextMenu.prototype,
			'render',
			(_: Record<string, unknown>[], component: any) =>
			{
				const appid: number = component._owner.pendingProps.overview.appid
				afterPatch(
						component.type.prototype,
						'shouldComponentUpdate',
						([nextProps]: any, shouldUpdate: any) =>
						{
							if (
									shouldUpdate===true &&
									!nextProps.children.find(
											(x: any) => x?.key==='metadeck-change-metadata'
									)
							)
							{
								let updatedAppid: number = appid
								const parentOverview = nextProps.children.find(
										(x: any) =>
												x?._owner?.pendingProps?.overview?.appid &&
												x._owner.pendingProps.overview.appid!==appid
								)
								if (parentOverview)
								{
									updatedAppid = parentOverview._owner.pendingProps.overview.appid
								}
								spliceArtworkItem(nextProps.children, updatedAppid, metadataManager)
							}
							return shouldUpdate
						},
						{singleShot: true}
				)

				spliceArtworkItem(component.props.children, appid, metadataManager)
				return component
			}
	)
}

export const getMenu = async () =>
{
	while (!(window as any).DeckyPluginLoader?.routerHook?.routes)
	{
		await new Promise((resolve) => setTimeout(resolve, 500))
	}

	let LibraryContextMenu = findInReactTree(
			fakeRenderComponent(
					findInTree(
							fakeRenderComponent(
									(window as any).DeckyPluginLoader.routerHook.routes.find(
											(x: any) => x?.props?.path=='/zoo'
									).props.children.type
							),
							(x) => x?.route==='/zoo/modals',
							{
								walkable: ['props', 'children', 'child', 'pages']
							}
					).content.type
			),
			(x) => x?.title?.includes('AppActionsMenu')
	).children.type

	if (!LibraryContextMenu?.prototype?.AddToHidden)
	{
		LibraryContextMenu = fakeRenderComponent(LibraryContextMenu).type
	}
	return LibraryContextMenu
}

export default contextMenuPatch