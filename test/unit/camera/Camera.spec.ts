import { ALIGN, DIRECTION, EVENTS } from "~/const/external";
import Camera from "~/camera/Camera";
import { BoundCameraMode, CircularCameraMode, LinearCameraMode } from "~/camera";
import FlickingError from "~/core/FlickingError";
import * as ERROR from "~/const/error";

import { createFlicking } from "../helper/test-util";
import El from "../helper/El";

describe("Camera", () => {
  describe("Properties", () => {
    it("should have element undefined as default", () => {
      expect(new Camera().element).to.be.undefined;
    });

    it("should have position 0 as default", () => {
      expect(new Camera().position).to.equal(0);
    });

    it("should have 0 as a default size", () => {
      expect(new Camera().size).to.equal(0);
    });

    it("should have alignPosition 0 as default", () => {
      expect(new Camera().alignPosition).to.equal(0);
    });

    it("should have range from 0 to 0 as default", () => {
      expect(new Camera().range.min).to.equal(0);
      expect(new Camera().range.max).to.equal(0);
    });

    it("should have visiblePanels as an empty array as default", () => {
      expect(new Camera().visiblePanels).to.be.empty;
    });

    it(`should have align ${ALIGN.CENTER} as default`, () => {
      expect(new Camera().align).to.equal(ALIGN.CENTER);
    });

    it("should return size same to viewport width when horizontal: true", async () => {
      const flicking = await await createFlicking(El.DEFAULT_HORIZONTAL, { horizontal: true });
      const camera = new Camera();

      camera.init(flicking);

      expect(camera.size).not.to.equal(0);
      expect(camera.size).to.equal(flicking.viewport.width);
      expect(camera.size).not.to.equal(flicking.viewport.height);
    });

    it("should return size same to viewport height when horizontal: false", async () => {
      const flicking = await createFlicking(El.DEFAULT_HORIZONTAL, { horizontal: false });
      const camera = new Camera();

      camera.init(flicking);

      expect(camera.size).not.to.equal(0);
      expect(camera.size).not.to.equal(flicking.viewport.width);
      expect(camera.size).to.equal(flicking.viewport.height);
    });

    describe("controlParams", () => {
      it("should return current range", () => {
        expect(new Camera().controlParams.range).to.deep.equal(new Camera().range);
      });

      it("should return current position", async () => {
        const camera = new Camera();
        const flicking = await createFlicking(El.DEFAULT_HORIZONTAL);

        camera.init(flicking);
        camera.lookAt(800);

        expect(camera.controlParams.position).to.equal(800);
      });

      it("should always return circular as false", () => {
        expect(new Camera().controlParams.circular).to.be.false;
      });
    });

    describe("visibleRange", () => {
      it("should return visible range from current position", async () => {
        const camera = new Camera({ align: ALIGN.CENTER });
        const flicking = await createFlicking(El.DEFAULT_HORIZONTAL);

        camera.init(flicking);
        camera.updateAlignPos();
        camera.lookAt(500);

        expect(camera.visibleRange.min).to.equal(500 - flicking.viewport.width / 2);
        expect(camera.visibleRange.max).to.equal(500 + flicking.viewport.width / 2);
      });
    });
  });

  describe("Methods", () => {
    describe("init", () => {
      it("should throw a FlickingError with code VAL_MUST_NOT_NULL when there's no camera element inside it", async () => {
        const camera = new Camera();
        const flicking = await createFlicking(El.DEFAULT_HORIZONTAL);

        // Remove viewport's children
        while (flicking.element.firstChild) {
          flicking.element.firstChild.remove();
        }

        expect(() => camera.init(flicking))
          .to.throw(FlickingError)
          .with.property("code", ERROR.CODE.VAL_MUST_NOT_NULL);
      });

      it("should set first child of the viewport element as its element", async () => {
        const camera = new Camera();
        const flicking = await createFlicking(El.DEFAULT_HORIZONTAL);

        camera.init(flicking);

        expect(camera.element).to.equal(flicking.element.firstChild);
      });

      it("should use LinearCameraMode by default", async () => {
        const camera = new Camera();
        const flicking = await createFlicking(El.DEFAULT_HORIZONTAL);

        camera.init(flicking);

        expect(camera.mode).to.be.an.instanceOf(LinearCameraMode);
      });

      it("should use BoundCameraMode when bound is true and the mode is available", async () => {
        const camera = new Camera();
        const flicking = await createFlicking(El.DEFAULT_HORIZONTAL, { bound: true });

        camera.init(flicking);

        expect(camera.mode).to.be.an.instanceOf(BoundCameraMode);
        expect(camera.mode.checkAvailability()).to.be.true;
      });

      it("should use CircularCameraMode when circular is true and the mode is available", async () => {
        const camera = new Camera();
        const flicking = await createFlicking(El.DEFAULT_HORIZONTAL, { circular: true });

        camera.init(flicking);

        expect(camera.mode).to.be.an.instanceOf(CircularCameraMode);
        expect(camera.mode.checkAvailability()).to.be.true;
      });

      it("should use LinearCameraMode when circular is true but it's not available & circularFallback is 'default'", async () => {
        const camera = new Camera();
        const flicking = await createFlicking(El.viewport().add(El.camera()), { circular: true, circularFallback: "default" });

        camera.init(flicking);

        expect(camera.mode).to.be.an.instanceOf(LinearCameraMode);
      });

      it("should use BoundCameraMode when circular is true but it's not available & circularFallback is 'default'", async () => {
        const camera = new Camera();
        const flicking = await createFlicking(El.viewport().add(El.camera()), { circular: true, circularFallback: "bound" });

        camera.init(flicking);

        expect(camera.mode).to.be.an.instanceOf(BoundCameraMode);
      });
    });

    describe("lookAt", () => {
      it("should throw a FlickingError with code NOT_ATTACHED_TO_FLICKING when it's not initialized yet", async () => {
        const camera = new Camera();

        expect(() => camera.lookAt(500))
          .to.throw(FlickingError)
          .with.property("code", ERROR.CODE.NOT_ATTACHED_TO_FLICKING);
      });

      it("should set position to given value", async () => {
        const camera = new Camera();
        const flicking = await createFlicking(El.DEFAULT_HORIZONTAL);
        const prevPosition = camera.position;

        camera.init(flicking);
        camera.lookAt(500);

        expect(camera.position).not.to.equal(prevPosition);
        expect(camera.position).to.equal(500);
      });

      it("should apply transform to camera element", async () => {
        const camera = new Camera();
        const flicking = await createFlicking(El.DEFAULT_HORIZONTAL);

        camera.init(flicking);
        camera.lookAt(500);

        expect(camera.element.style.transform).to.equal(`translate(${-(500 - camera.alignPosition)}px)`);
      });

      it("should update visible panels", async () => {
        const camera = new Camera();
        const flicking = await createFlicking(El.DEFAULT_HORIZONTAL);

        camera.init(flicking);
        camera.lookAt(500);

        expect(camera.visiblePanels).not.to.be.empty;
      });

      it(`should trigger flicking's ${EVENTS.VISIBLE_CHANGE} on visible panels update`, async () => {
        const camera = new Camera();
        const flicking = await createFlicking(El.DEFAULT_HORIZONTAL);
        const visibleChangeSpy = sinon.spy();

        flicking.on(EVENTS.VISIBLE_CHANGE, visibleChangeSpy);
        camera.init(flicking);
        camera.lookAt(500);

        await (async () => void 0)();

        expect(visibleChangeSpy.calledOnce).to.be.true;
      });

      it(`should trigger flicking's ${EVENTS.NEED_PANEL} for both sides when there're no panels`, async () => {
        const camera = new Camera();
        const flicking = await createFlicking(El.viewport().add(El.camera()));
        const needPanelSpy = sinon.spy();

        flicking.on(EVENTS.NEED_PANEL, needPanelSpy);
        camera.init(flicking);
        camera.lookAt(500);

        expect(needPanelSpy.calledTwice).to.be.true;
        expect(needPanelSpy.calledWithMatch({ direction: DIRECTION.NEXT })).to.be.true;
        expect(needPanelSpy.calledWithMatch({ direction: DIRECTION.PREV })).to.be.true;
      });

      it(`should trigger flicking's ${EVENTS.REACH_EDGE} when moving to range.min`, async () => {
        const camera = new Camera();
        const flicking = await createFlicking(El.viewport().add(El.camera()));
        const reachEdgeSpy = sinon.spy();

        (camera as any)._range = { min: -1000, max: 1000 };
        camera.init(flicking);
        flicking.on(EVENTS.REACH_EDGE, reachEdgeSpy);
        camera.lookAt(-1000);

        expect(reachEdgeSpy.calledOnce).to.be.true;
        expect(reachEdgeSpy.calledWithMatch({ direction: DIRECTION.PREV })).to.be.true;
      });

      it(`should trigger flicking's ${EVENTS.REACH_EDGE} when moving to range.max`, async () => {
        const camera = new Camera();
        const flicking = await createFlicking(El.viewport().add(El.camera()));
        const reachEdgeSpy = sinon.spy();

        (camera as any)._range = { min: -1000, max: 1000 };
        camera.init(flicking);
        flicking.on(EVENTS.REACH_EDGE, reachEdgeSpy);
        camera.lookAt(1000);

        expect(reachEdgeSpy.calledOnce).to.be.true;
        expect(reachEdgeSpy.calledWithMatch({ direction: DIRECTION.NEXT })).to.be.true;
      });

      it(`should noot trigger flicking's ${EVENTS.REACH_EDGE} when moving from outside of range to range.min`, async () => {
        const camera = new Camera();
        const flicking = await createFlicking(El.viewport().add(El.camera()));
        const reachEdgeSpy = sinon.spy();

        (camera as any)._range = { min: -1000, max: 1000 };
        camera.init(flicking);
        camera.lookAt(-1001); // Move to outside
        flicking.on(EVENTS.REACH_EDGE, reachEdgeSpy);
        camera.lookAt(-1000); // Move to outside

        expect(reachEdgeSpy.called).to.be.false;
      });

      it(`should noot trigger flicking's ${EVENTS.REACH_EDGE} when moving from outside of range to range.max`, async () => {
        const camera = new Camera();
        const flicking = await createFlicking(El.viewport().add(El.camera()));
        const reachEdgeSpy = sinon.spy();

        (camera as any)._range = { min: -1000, max: 1000 };
        camera.init(flicking);
        camera.lookAt(1001); // Move to outside
        flicking.on(EVENTS.REACH_EDGE, reachEdgeSpy);
        camera.lookAt(1000); // Move to outside

        expect(reachEdgeSpy.called).to.be.false;
      });
    });

    describe("findAnchorIncludePosition", () => {
      it("should return panel at given position", async () => {
        const camera = new Camera();
        const flicking = await createFlicking(El.DEFAULT_HORIZONTAL);
        const panels = flicking.panels;

        camera.init(flicking);
        camera.updateAnchors();

        expect(camera.findAnchorIncludePosition(panels[0].position).panel).to.equal(panels[0]);
        expect(camera.findAnchorIncludePosition(panels[1].position).panel).to.equal(panels[1]);
        expect(camera.findAnchorIncludePosition(panels[2].position).panel).to.equal(panels[2]);
      });

      it("should return null when no panel includes given position", async () => {
        const camera = new Camera();
        const flicking = await createFlicking(El.DEFAULT_HORIZONTAL);
        const panels = flicking.panels;

        camera.init(flicking);
        camera.updateAnchors();

        expect(camera.findAnchorIncludePosition(-999999999)).to.be.null;
        expect(camera.findAnchorIncludePosition(999999999)).to.be.null;
        expect(camera.findAnchorIncludePosition(panels[2].range.max + 1)).to.be.null;
        expect(camera.findAnchorIncludePosition(panels[0].range.min - 1)).to.be.null;
      });
    });

    describe("findNearestAnchor", () => {
      it("should return null when there're no panels", async () => {
        const camera = new Camera();
        const flicking = await createFlicking(El.viewport().add(El.camera()));

        camera.init(flicking);
        camera.updateAnchors();

        expect(camera.findNearestAnchor(0)).to.be.null;
      });

      it("should return correct panel underneath it", async () => {
        const camera = new Camera();
        const flicking = await createFlicking(El.DEFAULT_HORIZONTAL);

        camera.init(flicking);
        camera.updateAnchors();
        camera.lookAt(flicking.getPanel(1).position);

        const nearestAnchor = camera.findNearestAnchor(camera.position);
        expect(nearestAnchor.panel).to.equal(flicking.getPanel(1));
        expect(nearestAnchor.position).to.equal(flicking.getPanel(1).position);
      });
    });

    describe("updateRange", () => {
      it("should update mode before setting new range", async () => {
        const flicking = await createFlicking(El.DEFAULT_HORIZONTAL);
        const camera = flicking.camera;
        const prevMode = camera.mode;

        flicking.circular = true; // This should change mode to Circular
        camera.updateRange();

        const newMode = camera.mode;
        expect(newMode).not.to.equal(prevMode);
        expect(newMode).to.be.instanceOf(CircularCameraMode);
      });
    });

    describe("updateAlignPos", () => {
      it("should update alignPosition using current align value", async () => {
        const camera = new Camera({ align: "80%" });
        const flicking = await createFlicking(El.DEFAULT_HORIZONTAL);
        const prevAlignPosition = camera.alignPosition;

        camera.init(flicking);
        camera.updateAlignPos();

        expect(camera.alignPosition).not.to.equal(prevAlignPosition);
        expect(camera.alignPosition).to.equal(flicking.viewport.width * 0.8);
      });

      it("should use property 'camera' if align is given as an object", async () => {
        const camera = new Camera({ align: { panel: "30%", camera: "70%" } });
        const flicking = await createFlicking(El.DEFAULT_HORIZONTAL);
        const prevAlignPosition = camera.alignPosition;

        camera.init(flicking);
        camera.updateAlignPos();

        expect(camera.alignPosition).not.to.equal(prevAlignPosition);
        expect(camera.alignPosition).to.equal(flicking.viewport.width * 0.7);
      });
    });
  });
});
