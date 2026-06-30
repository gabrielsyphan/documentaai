import { createReactInlineContentSpec } from "@blocknote/react";
import { usePagesStore } from "../../store/pages.store";
import { Link2 } from "lucide-react";

export const WikiLink = createReactInlineContentSpec(
  {
    type: "wikilink" as const,
    propSchema: {
      title:  { default: "" },
      pageId: { default: "" },
    },
    content: "none",
  },
  {
    render: ({ inlineContent }) => {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const selectPage = usePagesStore((s) => s.selectPage);

      function handleClick(e: React.MouseEvent) {
        e.preventDefault();
        if (inlineContent.props.pageId) selectPage(inlineContent.props.pageId);
      }

      return (
        <span
          className="wiki-link-chip"
          onClick={handleClick}
          title={`Ir para "${inlineContent.props.title}"`}
          contentEditable={false}
        >
          <Link2 size={10} />
          {inlineContent.props.title || "Sem título"}
        </span>
      );
    },
  }
);
