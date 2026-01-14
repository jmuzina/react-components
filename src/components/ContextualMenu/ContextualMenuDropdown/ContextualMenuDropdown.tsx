import classNames from "classnames";
import React, { useCallback, useEffect, useRef, useState } from "react";
import type { HTMLProps, ReactNode } from "react";

import { useWindowFitment } from "hooks";
import Button from "../../Button";
import type { ButtonProps } from "../../Button";
import type { WindowFitment } from "hooks";

export enum Label {
  Dropdown = "submenu",
}

/**
 * The type of the menu links.
 * @template L - The type of the link props.
 */
export type MenuLink<L = null> = string | ButtonProps<L> | ButtonProps<L>[];

export type Position = "left" | "center" | "right";
type VerticalPosition = "top" | "bottom";

/**
 * The props for the ContextualMenuDropdown component.
 * @template L - The type of the link props.
 */
export type Props<L = null> = {
  adjustedPosition?: Position;
  autoAdjust?: boolean;
  handleClose?: (evt?: React.MouseEvent<HTMLButtonElement>) => void;
  constrainPanelWidth?: boolean;
  dropdownClassName?: string;
  dropdownContent?: ReactNode | ((close: () => void) => React.JSX.Element);
  id?: string;
  isOpen?: boolean;
  links?: MenuLink<L>[];
  position?: Position;
  positionCoords?: DOMRect;
  positionNode?: HTMLElement;
  scrollOverflow?: boolean;
  setAdjustedPosition?: (position: Position) => void;
  contextualMenuClassName?: string;
} & HTMLProps<HTMLSpanElement>;

/**
 * Calculate the styles for the menu.
 * @param position - The menu position.
 * @param verticalPosition - The vertical position (top or bottom).
 * @param positionCoords - The coordinates of the position node.
 * @param constrainPanelWidth - Whether the menu width should be constrained to the position width.
 */
const getPositionStyle = (
  position: Position,
  verticalPosition: VerticalPosition,
  positionCoords: Props["positionCoords"],
  constrainPanelWidth: Props["constrainPanelWidth"],
): React.CSSProperties => {
  if (!positionCoords) {
    return null;
  }
  const { height, left, top, width } = positionCoords;
  const topPos =
    verticalPosition === "bottom"
      ? top + height + (window.scrollY || 0)
      : top + (window.scrollY || 0);
  let leftPos = left;

  switch (position) {
    case "left":
      leftPos = left;
      break;
    case "center":
      leftPos = left + width / 2;
      break;
    case "right":
      leftPos = left + width;
      break;
    default:
      break;
  }

  return {
    position: "absolute",
    left: leftPos,
    top: topPos,
    // The width only needs to be set if the width is to be constrained.
    ...(constrainPanelWidth ? { width } : null),
  };
};

/**
 * Calculate the adjusted position in relation to the window.
 * @param position - The requested position.
 * @param fitsWindow - The window fitment info.
 * @return The new position.
 */
export const adjustForWindow = (
  position: Position,
  fitsWindow: WindowFitment,
): Position => {
  let newPosition: string = position;
  if (!fitsWindow.fromRight.fitsLeft && newPosition === "right") {
    newPosition = "left";
  }
  if (!fitsWindow.fromLeft.fitsRight && newPosition === "left") {
    newPosition = "right";
  }
  // If the menu doesn't fit to the left or the right then center it.
  if (
    !fitsWindow.fromLeft.fitsRight &&
    !fitsWindow.fromRight.fitsLeft &&
    (newPosition === "left" || newPosition === "right")
  ) {
    newPosition = "center";
  }
  // If the menu doesn't fit when centered then find a new position.
  if (
    newPosition === "center" &&
    (!fitsWindow.fromCenter.fitsCentered.fitsRight ||
      !fitsWindow.fromCenter.fitsCentered.fitsLeft)
  ) {
    if (fitsWindow.fromLeft.fitsRight) {
      newPosition = "left";
    }
    if (fitsWindow.fromRight.fitsLeft) {
      newPosition = "right";
    }
  }
  return newPosition as Position;
};

/**
 * Generate a menu link
 * @template L - The type of the link props.
 * @param link - A button
 * @param key - A key for the DOM.
 * @param handleClose - The function to close the menu.
 * @param ref - Optional ref for focus management.
 */
const generateLink = <L,>(
  link: ButtonProps,
  key: React.Key,
  handleClose: Props["handleClose"],
  ref?: React.Ref<HTMLButtonElement>
) => {
  const { children, className, onClick, ...props } = link;
  return (
    <Button<L>
      className={classNames("p-contextual-menu__link", className)}
      key={key}
      role={props.role || "menuitem"}
      onClick={
        onClick
          ? (evt) => {
              handleClose(
                evt.nativeEvent as unknown as React.MouseEvent<HTMLButtonElement>,
              );
              onClick(evt);
            }
          : null
      }
      ref={ref}
      {...props}
    >
      {children}
    </Button>
  );
};

const getClosestScrollableParent = (
  node: HTMLElement | null,
): HTMLElement | null => {
  let currentNode = node;
  while (currentNode && currentNode !== document.body) {
    const { overflowY, overflowX } = window.getComputedStyle(currentNode);
    if (
      ["auto", "scroll", "overlay"].includes(overflowY) &&
      ["auto", "scroll", "overlay"].includes(overflowX)
    ) {
      return currentNode;
    }
    currentNode = currentNode.parentElement;
  }
  return document.body;
};

// nearest parents z-index that is not 0 or auto
export const getNearestParentsZIndex = (
  element: HTMLElement | null,
): string => {
  if (!window || !element) {
    return "0";
  }
  const zIndex = window
    .getComputedStyle(element, null)
    .getPropertyValue("z-index");
  if (!element.parentElement) {
    return zIndex;
  }
  if (zIndex === "auto" || zIndex === "0" || zIndex === "") {
    return getNearestParentsZIndex(element.parentElement);
  }
  return zIndex;
};

const ContextualMenuDropdown = <L,>({
  adjustedPosition,
  autoAdjust,
  handleClose,
  constrainPanelWidth,
  dropdownClassName,
  dropdownContent,
  id,
  isOpen,
  links,
  position,
  positionCoords,
  positionNode,
  scrollOverflow,
  setAdjustedPosition,
  contextualMenuClassName,
  ...props
}: Props<L>): React.JSX.Element => {
  const dropdown = useRef<HTMLDivElement>(null);
  // Track refs for each menuitem for focus management
  const menuItemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  // Track focused menuitem index
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  // Track last focused index for menubar behavior
  const lastFocusedIndex = useRef<number>(-1);
  const [verticalPosition, setVerticalPosition] =
    useState<VerticalPosition>("bottom");
  const [positionStyle, setPositionStyle] = useState(
    getPositionStyle(
      adjustedPosition,
      verticalPosition,
      positionCoords,
      constrainPanelWidth,
    ),
  );
  const [maxHeight, setMaxHeight] = useState<number>();

  // Helper: get all focusable menuitems (not disabled)
  const getFocusableMenuItems = () => {
    return menuItemRefs.current.filter(
      (el) =>
        el &&
        !el.hasAttribute("disabled") &&
        el.getAttribute("aria-disabled") !== "true",
    );
  };

  // Focus the menuitem at focusedIndex
  useEffect(() => {
    if (!isOpen) return;
    const items = getFocusableMenuItems();
    if (focusedIndex >= 0 && items[focusedIndex]) {
      items[focusedIndex].focus();
    }
  }, [focusedIndex, isOpen]);

  // On menu open, focus first item or last focused
  useEffect(() => {
    if (!isOpen) return;
    const items = getFocusableMenuItems();
    if (lastFocusedIndex.current >= 0 && items[lastFocusedIndex.current]) {
      setFocusedIndex(lastFocusedIndex.current);
    } else {
      setFocusedIndex(0);
    }
    // Focus the menu container for keyboard events
    dropdown.current?.focus();
  }, [isOpen]);

  // Update last focused index
  useEffect(() => {
    if (focusedIndex >= 0) {
      lastFocusedIndex.current = focusedIndex;
    }
  }, [focusedIndex]);

  // Keyboard navigation handler
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const items = getFocusableMenuItems();
    if (!items.length) return;
    const maxIdx = items.length - 1;
    const idx = focusedIndex;
    switch (e.key) {
      case "Tab":
        // Move focus out and close menu
        if (handleClose) handleClose();
        setFocusedIndex(-1);
        break;
      case "Enter":
        if (items[idx]) {
          items[idx].click();
        }
        if (handleClose) handleClose();
        break;
      case " ":
        if (items[idx]) {
          items[idx].click();
        }
        if (handleClose) handleClose();
        break;
      case "ArrowDown":
        setFocusedIndex(idx < maxIdx ? idx + 1 : 0);
        e.preventDefault();
        break;
      case "ArrowUp":
        setFocusedIndex(idx > 0 ? idx - 1 : maxIdx);
        e.preventDefault();
        break;
      case "Home":
        setFocusedIndex(0);
        e.preventDefault();
        break;
      case "End":
        setFocusedIndex(maxIdx);
        e.preventDefault();
        break;
      case "Escape":
        if (handleClose) handleClose();
        setFocusedIndex(-1);
        break;
      default:
        if (e.key.length === 1 && /\S/.test(e.key)) {
          const start = idx + 1;
          const search = e.key.toLowerCase();
          for (let i = start; i < items.length; i++) {
            const label = items[i].textContent?.trim().toLowerCase();
            if (label && label.startsWith(search)) {
              setFocusedIndex(i);
              return;
            }
          }
          for (let i = 0; i < start; i++) {
            const label = items[i].textContent?.trim().toLowerCase();
            if (label && label.startsWith(search)) {
              setFocusedIndex(i);
              return;
            }
          }
        }
        break;
    }
  };

  // Update the styles to position the menu.
  const updatePositionStyle = useCallback(() => {
    setPositionStyle(
      getPositionStyle(
        adjustedPosition,
        verticalPosition,
        positionCoords,
        constrainPanelWidth,
      ),
    );
  }, [adjustedPosition, positionCoords, verticalPosition, constrainPanelWidth]);

  const focusFirstItem = useCallback(() => {
    // list of focusable selectors is based on this Stack Overflow answer:
    // https://stackoverflow.com/a/30753870/3732840
    const focusableElementSelectors =
      'a[href]:not([tabindex="-1"]), button:not([disabled]):not([aria-disabled="true"]), textarea:not([disabled]):not([aria-disabled="true"]):not([tabindex="-1"]), input:not([disabled]):not([aria-disabled="true"]):not([tabindex="-1"]), select:not([disabled]):not([aria-disabled="true"]):not([tabindex="-1"]), area[href]:not([tabindex="-1"]), iframe:not([tabindex="-1"]), [tabindex]:not([tabindex="-1"]), [contentEditable=true]:not([tabindex="-1"])';
    // the item is not interactable until the next animation frame.
    requestAnimationFrame(() => {
      const firstItem = dropdown?.current?.querySelector(
        focusableElementSelectors,
      );
      if (firstItem) {
        (firstItem as HTMLElement).focus();
      }
    });
  }, [dropdown]);

  useEffect(() => {
    if (!isOpen || !dropdown.current) return;
    focusFirstItem();
  }, [dropdown, focusFirstItem, isOpen]);

  // keyboard listener for TAB key

  const updateVerticalPosition = useCallback(() => {
    if (!positionNode) {
      return;
    }
    const scrollableParent = getClosestScrollableParent(positionNode);
    if (!scrollableParent) {
      return;
    }

    const scrollableParentRect = scrollableParent.getBoundingClientRect();
    const toggleRect = positionNode.getBoundingClientRect();

    // Calculate the rect in relation to the scrollableParent
    const relativeToScrollParentRect = {
      top: toggleRect.top - scrollableParentRect.top,
      bottom: toggleRect.bottom - scrollableParentRect.top,
    };

    const scrollParentSpaceBelow =
      scrollableParentRect.height - relativeToScrollParentRect.bottom;
    const scrollParentSpaceAbove = relativeToScrollParentRect.top;

    const dropdownHeight = dropdown.current.getBoundingClientRect().height ?? 0;

    const windowSpaceBelow = window.innerHeight - toggleRect.bottom;

    setVerticalPosition(
      (scrollParentSpaceBelow >= dropdownHeight &&
        windowSpaceBelow >= dropdownHeight) ||
        windowSpaceBelow > scrollParentSpaceAbove
        ? "bottom"
        : "top",
    );
  }, [positionNode]);

  // Update the position when the window fitment info changes.
  const onUpdateWindowFitment = useCallback(
    (fitsWindow: WindowFitment) => {
      if (autoAdjust) {
        setAdjustedPosition(adjustForWindow(position, fitsWindow));
        updateVerticalPosition();
      }
      if (scrollOverflow) {
        setMaxHeight(fitsWindow.fromBottom.spaceBelow - 16);
      }
    },
    [
      autoAdjust,
      position,
      scrollOverflow,
      setAdjustedPosition,
      updateVerticalPosition,
    ],
  );

  // Handle adjusting the horizontal position and scrolling of the dropdown so that it remains on screen.
  useWindowFitment(
    dropdown.current,
    positionNode,
    onUpdateWindowFitment,
    0,
    isOpen && (autoAdjust || scrollOverflow),
  );

  // Update the styles when the position changes.
  useEffect(() => {
    updatePositionStyle();
  }, [adjustedPosition, updatePositionStyle]);

  useEffect(() => {
    updateVerticalPosition();
  }, [updateVerticalPosition]);

  useEffect(() => {
    if (!dropdown.current) return;

    // align z-index: when we are in a modal context, we want the dropdown to be above the modal
    // apply the nearest parents z-index + 1
    const zIndex = getNearestParentsZIndex(positionNode);
    if (parseInt(zIndex) > 0) {
      dropdown.current.parentElement?.style.setProperty("z-index", zIndex + 1);
    }
  }, [positionNode]);

  // Remove ref from props before spreading onto the div
  const { ref: _ref, ...divProps } = props;

  return (
    <span className={contextualMenuClassName} style={positionStyle}>
      <div
        className={classNames("p-contextual-menu__dropdown", dropdownClassName)}
        id={id}
        aria-hidden={isOpen ? "false" : "true"}
        aria-label={Label.Dropdown}
        ref={dropdown}
        role={props.role || "menu"}
        tabIndex={-1} // Make menu container focusable
        onKeyDown={handleKeyDown}
        style={{
          ...(constrainPanelWidth && positionStyle?.width
            ? { width: positionStyle.width, minWidth: 0, maxWidth: "none" }
            : {}),
          ...(scrollOverflow
            ? { maxHeight, minHeight: "2rem", overflowX: "auto" }
            : {}),
          ...(verticalPosition === "top" ? { bottom: "0" } : {}),
        }}
        {...divProps}
      >
        {dropdownContent
          ? typeof dropdownContent === "function"
            ? dropdownContent(handleClose)
            : dropdownContent
          : links.map((item, i) => {
              if (Array.isArray(item)) {
                return (
                  <span
                    className="p-contextual-menu__group"
                    key={i}
                    role="group"
                  >
                    {item.map((link, j) =>
                      generateLink(
                        link,
                        j,
                        handleClose,
                        (el: HTMLButtonElement | null) => {
                          menuItemRefs.current[i + j] = el;
                        }
                      )
                    )}
                  </span>
                );
              } else if (typeof item === "string") {
                return (
                  <div className="p-contextual-menu__non-interactive" key={i}>
                    {item}
                  </div>
                );
              }
              return generateLink(
                item,
                i,
                handleClose,
                (el: HTMLButtonElement | null) => {
                  menuItemRefs.current[i] = el;
                }
              );
            })}
      </div>
    </span>
  );
};

export default ContextualMenuDropdown;
