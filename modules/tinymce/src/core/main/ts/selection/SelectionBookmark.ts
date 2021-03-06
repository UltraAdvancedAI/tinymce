/**
 * Copyright (c) Tiny Technologies, Inc. All rights reserved.
 * Licensed under the LGPL or a commercial license.
 * For LGPL see License.txt in the project root for license information.
 * For commercial licenses see https://www.tiny.cloud/
 */

import { Optional } from '@ephox/katamari';
import { PlatformDetection } from '@ephox/sand';
import { Compare, SimSelection, SugarElement, SugarNode, SugarText, Traverse } from '@ephox/sugar';
import Editor from '../api/Editor';
import * as NodeType from '../dom/NodeType';

const browser = PlatformDetection.detect().browser;

const clamp = function (offset, element) {
  const max = SugarNode.isText(element) ? SugarText.get(element).length : Traverse.children(element).length + 1;

  if (offset > max) {
    return max;
  } else if (offset < 0) {
    return 0;
  }

  return offset;
};

const normalizeRng = function (rng) {
  return SimSelection.range(
    rng.start(),
    clamp(rng.soffset(), rng.start()),
    rng.finish(),
    clamp(rng.foffset(), rng.finish())
  );
};

const isOrContains = function (root: SugarElement, elm: SugarElement) {
  return !NodeType.isRestrictedNode(elm.dom()) && (Compare.contains(root, elm) || Compare.eq(root, elm));
};

const isRngInRoot = function (root) {
  return function (rng) {
    return isOrContains(root, rng.start()) && isOrContains(root, rng.finish());
  };
};

const shouldStore = function (editor: Editor) {
  return editor.inline === true || browser.isIE();
};

const nativeRangeToSelectionRange = function (r) {
  return SimSelection.range(SugarElement.fromDom(r.startContainer), r.startOffset, SugarElement.fromDom(r.endContainer), r.endOffset);
};

const readRange = function (win) {
  const selection = win.getSelection();
  const rng = !selection || selection.rangeCount === 0 ? Optional.none() : Optional.from(selection.getRangeAt(0));
  return rng.map(nativeRangeToSelectionRange);
};

const getBookmark = function (root) {
  const win = Traverse.defaultView(root);

  return readRange(win.dom())
    .filter(isRngInRoot(root));
};

const validate = function (root, bookmark) {
  return Optional.from(bookmark)
    .filter(isRngInRoot(root))
    .map(normalizeRng);
};

const bookmarkToNativeRng = function (bookmark): Optional<Range> {
  const rng = document.createRange();

  try {
    // Might throw IndexSizeError
    rng.setStart(bookmark.start().dom(), bookmark.soffset());
    rng.setEnd(bookmark.finish().dom(), bookmark.foffset());
    return Optional.some(rng);
  } catch (_) {
    return Optional.none();
  }
};

const store = function (editor: Editor) {
  const newBookmark = shouldStore(editor) ? getBookmark(SugarElement.fromDom(editor.getBody())) : Optional.none();

  editor.bookmark = newBookmark.isSome() ? newBookmark : editor.bookmark;
};

const storeNative = function (editor: Editor, rng) {
  const root = SugarElement.fromDom(editor.getBody());
  const range = shouldStore(editor) ? Optional.from(rng) : Optional.none();

  const newBookmark = range.map(nativeRangeToSelectionRange)
    .filter(isRngInRoot(root));

  editor.bookmark = newBookmark.isSome() ? newBookmark : editor.bookmark;
};

const getRng = function (editor: Editor): Optional<Range> {
  const bookmark = editor.bookmark ? editor.bookmark : Optional.none();

  return bookmark
    .bind((x) => validate(SugarElement.fromDom(editor.getBody()), x))
    .bind(bookmarkToNativeRng);
};

const restore = function (editor: Editor) {
  getRng(editor).each(function (rng) {
    editor.selection.setRng(rng);
  });
};

export {
  store,
  storeNative,
  readRange,
  restore,
  getRng,
  getBookmark,
  validate
};
