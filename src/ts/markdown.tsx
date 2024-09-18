import {FC, useRef} from "react";
import {ReactMarkdown, ReactMarkdownOptions} from "react-markdown/lib/react-markdown";
import remarkGfm from "remark-gfm";
import {Focusable, Navigation} from "@decky/ui";

interface MarkdownProps extends ReactMarkdownOptions
{
	onDismiss?: () => void;
}

export const Markdown: FC<MarkdownProps> = (props) =>
{
	return (
			<Focusable>
				<ReactMarkdown
						remarkPlugins={[remarkGfm]}
						components={{
							div: (nodeProps) =>
									<Focusable {...nodeProps.node.properties}>{nodeProps.children}</Focusable>,
							a: (nodeProps) =>
							{
								const aRef = useRef<HTMLAnchorElement>(null);
								return (
										// TODO fix focus ring
										<Focusable
												onActivate={() =>
												{
												}}
												onOKButton={() =>
												{
													props.onDismiss?.();
													Navigation.NavigateToExternalWeb(aRef.current!.href);
												}}
												style={{display: 'inline'}}
										>
											<a ref={aRef} {...nodeProps.node.properties}>
												{nodeProps.children}
											</a>
										</Focusable>
								);
							},
						}}
						{...props}
				>{props.children}</ReactMarkdown>
			</Focusable>
	);
};