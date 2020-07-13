import React, { forwardRef, useCallback } from "react";
import Link from "next/link";

const WrappedLink = forwardRef(function WrappedLink(
  { customClick, onClick, ...rest },
  ref
) {
  const handleClick = useCallback(
    (e) => {
      customClick(e);
      onClick(e);
    },
    [customClick, onClick]
  );

  return <a ref={ref} {...rest} onClick={handleClick} />;
});

export default function LinkWithClickHandler({ onClick, children, ...rest }) {
  return (
    <Link {...rest} passHref>
      <WrappedLink customClick={onClick}>{children}</WrappedLink>
    </Link>
  );
}
