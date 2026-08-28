import { hideSkillTip, initUI, showSkillTip } from "./ui";

initUI();
void import("./gl/engine").then(({ initEngine }) =>
  initEngine({ showSkillTip, hideSkillTip }),
);
