import {Composition,registerRoot} from 'remotion';
import {demo,FPS} from '../core/project';
import {MasterCard} from '../workspace/MasterCard';
import {createMasterContent,masterCardProps,masterSizes} from '../workspace/master-content';
const master=createMasterContent(demo),defaults=masterCardProps(master,master.scenes[0].scene.id,'portrait');
function Root(){return <Composition id="MasterCard" component={MasterCard} width={1080} height={1350} fps={FPS} durationInFrames={defaults.entry.durationInFrames} defaultProps={defaults} calculateMetadata={({props})=>({...masterSizes[props.size],durationInFrames:props.entry.durationInFrames})}/>;}
registerRoot(Root);
