<?php
/*
Plugin Name: Control panel for SoundCloud（SoundCloud再生パネル）
Plugin URI: https://engineering.dn-voice.info/densuke-wp-plugin/ctrl-panel-soundcloud/
Description: Add SoundCloud control panel on your website
Version: 1.0
Author: densuke
Author URI: https://engineering.dn-voice.info/
License: GPL2

Copyright 2018 densuke (email : notgeek@dn-voice.info)

    This program is free software; you can redistribute it and/or modify
    it under the terms of the GNU General Public License, version 2, as
	published by the Free Software Foundation.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program; if not, write to the Free Software
    Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA
*/

if( !class_exists('dn_ctrp_sndcld_class') ){
    class dn_ctrp_sndcld_class{
        // 翻訳ファイルの文字列データ用の変数
        // variable for translation data (via *.mo file)
        private $lang;

        private const SETTINGSTYLE_SLUG = 'dn_ctrp_sndcld_setting_style';
        private const SETTINGSTYLE_PATH = 'styles/dn_ctrp_sndcld_setting_style.css';
        private const MENU_SLUG = 'dn_ctrp_sndcld_menu';

        private const WIDGETAPI_SCRIPT_SLUG = 'dn_ctrp_sndcld_widgetapi_script';
        private const WIDGETAPI_SCRIPT_PATH = 'scripts/dn-ctrp-sndcld-widgetapi-scripts.js';
        private const CONTROL_SCRIPT_SLUG = 'dn_ctrp_sndcld_control_script';
        private const CONTROL_SCRIPT_PATH = 'scripts/dn-ctrp-sndcld-control-scripts.js';
        private const CONTROL_STYLE_SLUG = 'dn_ctrp_sndcld_panel_style';
        private const CONTROL_STYLE_PATH = 'styles/dn-ctrp-sndcld-control-styles.css';

        // 翻訳ファイル名は「LANG_SLUG-国名.mo」となるように注意する( 例：prefix_my_lang-ja.mo )
        // Make sure the translation file name is "LANG_SLUG-country code.mo"( 例：prefix_my_lang-en.mo )
        private const LANG_SLUG = 'dn_ctrp_sndcld_lang';
        private const LANG_PATH = '/languages';

        private static $option_grp = 'dn_ctrp_sndcld_option_grp';
        private static $option_param = [
            //お好みのキー => DBに保存されるオプション名
            //any key name => Option name stored in DB
            'panel_pos' => 'dn_ctrp_sndcld_panel_position'
        ];

        /*****
        コンストラクタ。読み込み時にフックしたい処理をここに書いておく
        Constructor. Write the process you want to hook on loading here.
        *****/
        function __construct() {
            add_action( 'plugins_loaded', array( $this , 'plugin_init' ) );
            add_action( 'admin_menu', array( $this , 'add_menu' ) );
            add_action( 'admin_init', array( $this , 'setting_init' ) );
            add_filter('the_content', array( $this , 'dn_ctrp_sndcld_search_SoundCloud') );

            if(function_exists('register_uninstall_hook')) {
                register_uninstall_hook (__FILE__, array(get_class($this),'do_uninstall') );
            }
        }

        /*****
        plugins_loadedにフックした処理。翻訳ファイルを読むのはここがよさそう。
        Process that hooked to "plugins_loaded". It looks good here to read the translation file.
        *****/
        function plugin_init(){
            $this->load_lang_strings();
        }

        /*****
        翻訳ファイルの読み込み
        read the translation file.
        *****/
        private function load_lang_strings(){
            load_plugin_textdomain( self::LANG_SLUG, false, basename( dirname( __FILE__ ) ) . self::LANG_PATH );

            $this->lang['plugin_name'] = __('Control panel for SoundCloud', self::LANG_SLUG);
            $this->lang['setting_page'] = __('setting page', self::LANG_SLUG);
            $this->lang['position'] = __('Control panel position', self::LANG_SLUG);
            $this->lang['bottom'] = __('bottom', self::LANG_SLUG);
            $this->lang['upper'] = __('upper', self::LANG_SLUG);
            $this->lang['left'] = __('left', self::LANG_SLUG);
            $this->lang['right'] = __('right', self::LANG_SLUG);
        }

        /*****
        admin_menuにフックした処理。設定画面へのリンクをメニューに追加する
        Process that hooked to "admin_menu". Add a link to the setting view to the menu.
        *****/
        function add_menu(){
            $page = add_management_page( $this->lang['plugin_name'], $this->lang['plugin_name'], 'manage_options', self::MENU_SLUG, array($this,'show_menu') );

            // 設定画面でのみ読み込むCSSファイル
            // css file that read only at setting view.
            add_action( 'admin_print_styles-' . $page, array( $this , 'enque_setting_style' ) );
        }

        /*****
        設定画面のみ有効にするCSSファイルを読み込み
        css file that read only at setting view.
        *****/
        function enque_setting_style(){
            wp_enqueue_style( self::SETTINGSTYLE_SLUG , plugins_url(self::SETTINGSTYLE_PATH , __FILE__));
        }

        /*****
        admin_initにフックする処理
        Process that hooked to "admin_init".
        *****/
        function setting_init(){
            foreach( self::$option_param as $key => $val ){
                register_setting( self::$option_grp, $val );
            }
        }


        /*****
        設定画面のHTMLを作成、表示する関数
        *****/
        function show_menu(){
            ?>
                <h2><?php echo $this->lang['plugin_name'] . " " . $this->lang['setting_page']; ?></h2>
                <form method="post" action="options.php">
                    <?php settings_fields( self::$option_grp ); ?>
                    <?php do_settings_sections( self::$option_grp ); ?>
                    <hr>
                    <!-- ここに好きなform部品を追加する -->
                    <!-- Please add any form parts here -->
                    <h3><?php echo $this->lang['position']; ?></h3>

                    <p>
                        <input type="radio" id="<?php echo self::$option_param["panel_pos"]; ?>_bottom_id" name="<?php echo self::$option_param["panel_pos"]; ?>" value="bottom" <?php if( 'bottom' == get_option(self::$option_param["panel_pos"],"bottom") ) echo "checked"; ?>>
                        <label for="<?php echo self::$option_param["panel_pos"]; ?>_bottom_id"><?php echo $this->lang['bottom']; ?>
                        <img class="positionimg" src="<?php echo plugins_url("images/panel_position_bottom.png" , __FILE__); ?>" /></label>
                    </p>
                    <p>
                        <input type="radio" id="<?php echo self::$option_param["panel_pos"]; ?>_upper_id" name="<?php echo self::$option_param["panel_pos"]; ?>" value="upper" <?php if( 'upper' == get_option(self::$option_param["panel_pos"],"bottom") ) echo "checked"; ?>>
                        <label for="<?php echo self::$option_param["panel_pos"]; ?>_upper_id"><?php echo $this->lang['upper']; ?>
                        <img class="positionimg" src="<?php echo plugins_url("images/panel_position_upper.png" , __FILE__); ?>" /></label>
                    </p>
                    <p>
                        <input type="radio" id="<?php echo self::$option_param["panel_pos"]; ?>_left_id" name="<?php echo self::$option_param["panel_pos"]; ?>" value="left" <?php if( 'left' == get_option(self::$option_param["panel_pos"],"bottom") ) echo "checked"; ?>>
                        <label for="<?php echo self::$option_param["panel_pos"]; ?>_left_id"><?php echo $this->lang['left']; ?>
                        <img class="positionimg" src="<?php echo plugins_url("images/panel_position_left.png" , __FILE__); ?>" /></label>
                    </p>
                    <p>
                        <input type="radio" id="<?php echo self::$option_param["panel_pos"]; ?>_right_id" name="<?php echo self::$option_param["panel_pos"]; ?>" value="right" <?php if( 'right' == get_option(self::$option_param["panel_pos"],"bottom") ) echo "checked"; ?>>
                        <label for="<?php echo self::$option_param["panel_pos"]; ?>_right_id"><?php echo $this->lang['right']; ?>
                        <img class="positionimg" src="<?php echo plugins_url("images/panel_position_right.png" , __FILE__); ?>" /></label>
                    </p>

                    <?php submit_button(); ?>
                </form>
            <?php
        }

        function dn_ctrp_sndcld_search_SoundCloud($the_content){
            $additional = '';
            if(is_single() && preg_match_all('/ifram.*?src.*?https:\/\/w.soundcloud.co/i',$the_content)){
                wp_enqueue_script( self::WIDGETAPI_SCRIPT_SLUG , plugins_url(self::WIDGETAPI_SCRIPT_PATH , __FILE__) );
                wp_enqueue_script( self::CONTROL_SCRIPT_SLUG , plugins_url(self::CONTROL_SCRIPT_PATH , __FILE__) , array('jquery') );
                wp_enqueue_style( self::CONTROL_STYLE_SLUG , plugins_url(self::CONTROL_STYLE_PATH , __FILE__) );

                add_action( 'wp_footer', array($this , 'dn_ctrp_sndcld_insert_SoundCloud_panel') );
            }
            return $the_content;
        }

        function dn_ctrp_sndcld_insert_SoundCloud_panel(){
            $class = "dn_ctrp_sndcld_cls_" . get_option(self::$option_param["panel_pos"],"bottom");

            echo <<<EOF
            <div id="dn_ctrp_sndcld_CtrPanel" class="$class">
                <div id="dn_ctrp_sndcld_playbutton" class="stop"> </div>
                <div id="dn_ctrp_sndcld_artwork"></div>
                <div id="dn_ctrp_sndcld_title"><span></span></div>
                <div id="dn_ctrp_sndcld_prevbutton"></div>
                <div id="dn_ctrp_sndcld_nextbutton"></div>
                <div id="dn_ctrp_sndcld_hidebutton">×</div>
            </div>
EOF;
        }

        /*****
        アンインストール時にoption値をDBから削除する関数
        *****/
        static function do_uninstall(){
            foreach( self::$option_param as $key => $val ){
                unregister_setting( self::$option_grp, $val );
                delete_option($val);
            }
        }

    }
    new dn_ctrp_sndcld_class();
}

?>
